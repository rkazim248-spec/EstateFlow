import { NextResponse } from "next/server";

import {
  buildImagePrompt,
  generateRequestSchema,
  type GenerateRequest,
} from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DEFAULT_MODEL = "gemini-2.5-flash-image";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function failure(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function configuredModel(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
}

function configuredKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

/** Best-effort per-instance limit; a production deployment should add a shared limiter. */
function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(uid);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(uid, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

/**
 * Verifies a Firebase ID token using the Identity Toolkit lookup endpoint.
 * This avoids shipping a service-account key to the server for a feature that
 * only needs to know which signed-in user is calling.
 */
async function verifyIdToken(token: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is missing on the server.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (response.status === 400) return null;
  if (!response.ok) {
    throw new Error(`Token verification failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    users?: Array<{ localId?: string }>;
  };
  const uid = data.users?.[0]?.localId;
  return typeof uid === "string" && uid ? uid : null;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(configuredKey()),
    model: configuredModel(),
    authConfigured: Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    ),
  });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return failure(401, "unauthorized", "Sign in again to generate an image.");
  }

  let uid: string | null = null;
  try {
    uid = await verifyIdToken(token);
  } catch (error) {
    return failure(
      503,
      "auth_unavailable",
      error instanceof Error
        ? error.message
        : "Could not verify your session.",
    );
  }

  if (!uid) {
    return failure(401, "unauthorized", "Your session has expired. Sign in again.");
  }

  if (!checkRateLimit(uid)) {
    return failure(
      429,
      "rate_limited",
      "You have reached the generation limit for now. Try again in about ten minutes.",
    );
  }

  const apiKey = configuredKey();
  if (!apiKey) {
    return failure(
      503,
      "not_configured",
      "AI image generation is not configured on this deployment. Add GEMINI_API_KEY to the server environment and restart.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(400, "invalid_request", "Send a JSON request body.");
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      400,
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Check the generation form.",
    );
  }

  const input: GenerateRequest = parsed.data;
  const prompt = buildImagePrompt(input);
  const model = configuredModel();

  let providerResponse: Response;
  try {
    providerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Sent as a header so the key never appears in a URL or logs.
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: input.aspectRatio },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(120_000),
      },
    );
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return failure(
      timedOut ? 504 : 502,
      timedOut ? "timeout" : "provider_unreachable",
      timedOut
        ? "The image provider took too long. Try again, or simplify the prompt."
        : "The image provider could not be reached. Try again shortly.",
    );
  }

  if (!providerResponse.ok) {
    let detail = "";
    try {
      const errorBody = (await providerResponse.json()) as {
        error?: { message?: string };
      };
      detail = errorBody.error?.message ?? "";
    } catch {
      // The provider occasionally returns an HTML error page.
    }

    if (providerResponse.status === 429) {
      return failure(
        429,
        "provider_rate_limited",
        "The image provider is rate-limiting this project. Try again later.",
      );
    }
    if (providerResponse.status === 401 || providerResponse.status === 403) {
      return failure(
        502,
        "provider_auth",
        "The configured Gemini API key was rejected. Check GEMINI_API_KEY and that the Gemini API is enabled for its project.",
      );
    }
    if (providerResponse.status === 404) {
      return failure(
        502,
        "model_unavailable",
        `The configured image model (${model}) is not available to this API key. Set GEMINI_IMAGE_MODEL to a model the key can use.`,
      );
    }

    return failure(
      502,
      "provider_error",
      detail
        ? `The image provider rejected the request: ${detail.slice(0, 300)}`
        : "The image provider rejected the request. Check the model and API key.",
    );
  }

  const data = (await providerResponse.json()) as {
    candidates?: Array<{
      content?: { parts?: GeminiPart[] };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const imagePart = parts.find(
    (part) => typeof part.inlineData?.data === "string" && part.inlineData.data,
  );

  if (!imagePart?.inlineData?.data) {
    const blocked =
      data.promptFeedback?.blockReason ?? candidate?.finishReason ?? null;
    return failure(
      422,
      "no_image",
      blocked
        ? `The provider did not return an image (${blocked}). Rephrase the prompt and try again.`
        : "The provider returned no image. Rephrase the prompt and try again.",
    );
  }

  const mimeType = imagePart.inlineData.mimeType?.startsWith("image/")
    ? imagePart.inlineData.mimeType
    : "image/png";

  const text =
    parts
      .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
      .filter(Boolean)
      .join("\n") || null;

  return NextResponse.json({
    image: {
      dataUrl: `data:${mimeType};base64,${imagePart.inlineData.data}`,
      mimeType,
    },
    text,
    prompt,
    model,
    aspectRatio: input.aspectRatio,
  });
}
