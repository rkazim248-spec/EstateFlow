import { z } from "zod";

export const AI_STYLE_IDS = [
  "editorial",
  "architectural",
  "warm-interior",
  "twilight",
  "minimal",
  "luxury",
] as const;
export type AiStyleId = (typeof AI_STYLE_IDS)[number];

export const AI_STYLES: Array<{
  id: AiStyleId;
  label: string;
  description: string;
  prompt: string;
}> = [
  {
    id: "editorial",
    label: "Editorial",
    description: "Natural light, calm palette",
    prompt:
      "editorial interior photography with natural window light, a calm neutral palette, honest materials and uncluttered styling",
  },
  {
    id: "architectural",
    label: "Architectural",
    description: "Clean geometry, wide angle",
    prompt:
      "architectural photography with clean geometry, straight verticals, a wide composition and late-afternoon light",
  },
  {
    id: "warm-interior",
    label: "Warm interior",
    description: "Inviting, textured, practical",
    prompt:
      "a warm interior lifestyle scene with textured fabrics, timber, soft practical lighting and an inviting atmosphere",
  },
  {
    id: "twilight",
    label: "Twilight exterior",
    description: "Dusk, lit windows",
    prompt:
      "a dusk exterior with warm interior lights, a deep calm sky, restrained landscaping and a quiet street",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Studio backdrop, soft shadow",
    prompt:
      "a minimal studio composition on a seamless neutral backdrop with one soft shadow and no props",
  },
  {
    id: "luxury",
    label: "Luxury",
    description: "Stone, timber, cinematic",
    prompt:
      "a refined luxury interior with stone, timber, restrained styling and cinematic but natural light; elegant, never ostentatious",
  },
];

export const AI_PURPOSE_IDS = ["sale", "rent", "social", "concept"] as const;
export type AiPurposeId = (typeof AI_PURPOSE_IDS)[number];

export const AI_PURPOSES: Array<{
  id: AiPurposeId;
  label: string;
  description: string;
  prompt: string;
}> = [
  {
    id: "sale",
    label: "Sale listing",
    description: "A still image for a property for sale",
    prompt:
      "present the property as a still marketing image for a sale listing",
  },
  {
    id: "rent",
    label: "Rental listing",
    description: "A still image for a rental listing",
    prompt:
      "present the property as a still marketing image for a rental listing",
  },
  {
    id: "social",
    label: "Social post",
    description: "Composed for a feed, no text added",
    prompt:
      "compose it for a social media feed with clear focal space, but add no text, logos or captions",
  },
  {
    id: "concept",
    label: "Concept view",
    description: "Explore a design direction",
    prompt:
      "visualise a design direction for the property without implying that it is an existing photograph",
  },
];

export const AI_ASPECT_IDS = ["4:3", "16:9", "1:1", "4:5", "9:16"] as const;
export type AiAspectRatioId = (typeof AI_ASPECT_IDS)[number];

export const AI_ASPECT_RATIOS: Array<{
  id: AiAspectRatioId;
  label: string;
  description: string;
  /** Tailwind classes for the on-screen preview frame. */
  frameClass: string;
  /** Tiny proportional glyph used in the ratio picker. */
  boxClass: string;
}> = [
  { id: "4:3", label: "4:3", description: "Landscape", frameClass: "aspect-[4/3]", boxClass: "h-4 w-[21px]" },
  { id: "16:9", label: "16:9", description: "Wide", frameClass: "aspect-[16/9]", boxClass: "h-[15px] w-[27px]" },
  { id: "1:1", label: "1:1", description: "Square", frameClass: "aspect-square", boxClass: "h-5 w-5" },
  { id: "4:5", label: "4:5", description: "Portrait", frameClass: "aspect-[4/5]", boxClass: "h-[22px] w-[18px]" },
  { id: "9:16", label: "9:16", description: "Story", frameClass: "aspect-[9/16]", boxClass: "h-6 w-[14px]" },
];

export const generateRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Describe the image you want in a few words.")
    .max(1200, "Keep the prompt under 1200 characters."),
  style: z.enum(AI_STYLE_IDS),
  purpose: z.enum(AI_PURPOSE_IDS),
  aspectRatio: z.enum(AI_ASPECT_IDS),
  propertySummary: z.string().trim().max(600).optional().default(""),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/**
 * Composes the provider prompt. Kept in one place so the prompt returned to the
 * client matches exactly what was sent to the image model.
 */
export function buildImagePrompt(input: GenerateRequest): string {
  const style = AI_STYLES.find((item) => item.id === input.style) ?? AI_STYLES[0];
  const purpose =
    AI_PURPOSES.find((item) => item.id === input.purpose) ?? AI_PURPOSES[0];

  const lines = [
    "Create one polished real-estate marketing image.",
    `Purpose: ${purpose.prompt}.`,
    `Visual direction: ${style.prompt}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    input.propertySummary
      ? `Property context supplied by the user: ${input.propertySummary}.`
      : "No specific property was supplied; keep the scene generic and plausible.",
    `Scene requested by the user: ${input.prompt}.`,
    "Constraints: no text, no logos, no watermarks, no identifiable people, no house numbers or readable signage. Keep architecture structurally plausible and rooms coherent.",
    "Treat the result as a conceptual illustration, not a photograph of an actual listing.",
  ];

  return lines.join("\n");
}
