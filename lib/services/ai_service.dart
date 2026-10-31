import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Configuration for the AI image generation endpoint.
class AiConfig {
  const AiConfig._();

  /// Base URL of the EstateFlow web app that hosts the `/api/ai/generate` route.
  ///
  /// Pass via `--dart-define=ESTATEFLOW_AI_API_URL=https://your-app.example.com`
  /// at build time. When empty, AI generation is honestly reported as
  /// not configured.
  static const String apiUrl = String.fromEnvironment(
    'ESTATEFLOW_AI_API_URL',
    defaultValue: '',
  );

  static bool get isConfigured => apiUrl.trim().isNotEmpty;
}

/// Result of an AI image generation request.
class AiGenerationResult {
  const AiGenerationResult({
    required this.imageDataUrl,
    required this.mimeType,
    this.text,
    this.prompt,
    this.model,
    this.aspectRatio,
  });

  final String imageDataUrl;
  final String mimeType;
  final String? text;
  final String? prompt;
  final String? model;
  final String? aspectRatio;
}

/// Calls the EstateFlow AI image generation endpoint.
class AiService {
  AiService({this._client});

  final http.Client? _client;

  http.Client get _httpClient => _client ?? http.Client();

  /// Checks whether the server reports AI generation as configured.
  Future<bool> isConfigured() async {
    if (!AiConfig.isConfigured) return false;
    try {
      final response = await _httpClient
          .get(Uri.parse('${AiConfig.apiUrl}/api/ai/generate'))
          .timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) return false;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['configured'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Generates an image from a prompt. Returns null if the server is not
  /// configured or the request fails.
  Future<AiGenerationResult?> generate({
    required String firebaseIdToken,
    required String prompt,
    String style = 'editorial',
    String purpose = 'sale',
    String aspectRatio = '4:3',
    String propertySummary = '',
  }) async {
    if (!AiConfig.isConfigured) return null;

    try {
      final response = await _httpClient
          .post(
            Uri.parse('${AiConfig.apiUrl}/api/ai/generate'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $firebaseIdToken',
            },
            body: jsonEncode({
              'prompt': prompt,
              'style': style,
              'purpose': purpose,
              'aspectRatio': aspectRatio,
              'propertySummary': propertySummary,
            }),
          )
          .timeout(const Duration(seconds: 120));

      if (response.statusCode != 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>?;
        final message = data?['error']?['message'] as String? ??
            'Generation failed (${response.statusCode}).';
        throw Exception(message);
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final image = data['image'] as Map<String, dynamic>?;
      final dataUrl = image?['dataUrl'] as String?;
      final mimeType = image?['mimeType'] as String? ?? 'image/png';
      if (dataUrl == null) return null;

      return AiGenerationResult(
        imageDataUrl: dataUrl,
        mimeType: mimeType,
        text: data['text'] as String?,
        prompt: data['prompt'] as String?,
        model: data['model'] as String?,
        aspectRatio: data['aspectRatio'] as String?,
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('AI generation error: $e');
      }
      rethrow;
    }
  }
}