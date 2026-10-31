import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../services/ai_service.dart';
import '../../services/auth_service.dart';
import '../../services/media_repository.dart';

/// AI Image Studio screen for generating marketing images.
class AiStudioScreen extends StatefulWidget {
  const AiStudioScreen({super.key, this.authService});

  final AuthService? authService;

  @override
  State<AiStudioScreen> createState() => _AiStudioScreenState();
}

class _AiStudioScreenState extends State<AiStudioScreen> {
  final _promptController = TextEditingController();
  final _propertySummaryController = TextEditingController();

  String _style = 'editorial';
  String _purpose = 'sale';
  String _aspectRatio = '4:3';

  bool _generating = false;
  bool _configured = false;
  bool _checkingConfig = true;
  String? _error;
  String? _resultDataUrl;
  String? _resultText;
  bool _saving = false;

  static const _styles = [
    ('editorial', 'Editorial', 'Natural light, calm palette'),
    ('architectural', 'Architectural', 'Clean geometry, wide angle'),
    ('warm-interior', 'Warm interior', 'Inviting, textured, practical'),
    ('twilight', 'Twilight exterior', 'Dusk, lit windows'),
    ('minimal', 'Minimal', 'Studio backdrop, soft shadow'),
    ('luxury', 'Luxury', 'Stone, timber, cinematic'),
  ];

  static const _purposes = [
    ('sale', 'Sale listing', 'A still image for a property for sale'),
    ('rent', 'Rental listing', 'A still image for a rental listing'),
    ('social', 'Social post', 'Composed for a feed, no text added'),
    ('concept', 'Concept view', 'Explore a design direction'),
  ];

  static const _aspectRatios = [
    ('4:3', '4:3', 'Landscape'),
    ('16:9', '16:9', 'Wide'),
    ('1:1', '1:1', 'Square'),
    ('4:5', '4:5', 'Portrait'),
    ('9:16', '9:16', 'Story'),
  ];

  @override
  void initState() {
    super.initState();
    _checkConfig();
  }

  @override
  void dispose() {
    _promptController.dispose();
    _propertySummaryController.dispose();
    super.dispose();
  }

  Future<void> _checkConfig() async {
    final configured = await AiService().isConfigured();
    if (mounted) {
      setState(() {
        _configured = configured;
        _checkingConfig = false;
      });
    }
  }

  Future<void> _generate() async {
    final prompt = _promptController.text.trim();
    if (prompt.length < 3) {
      setState(() => _error = 'Describe the image you want in a few words.');
      return;
    }

    final token = await widget.authService?.getIdToken() ??
        await (FirebaseAuth.instance.currentUser?.getIdToken());
    if (token == null) {
      setState(() => _error = 'Sign in again to generate an image.');
      return;
    }

    setState(() {
      _generating = true;
      _error = null;
      _resultDataUrl = null;
      _resultText = null;
    });

    try {
      final result = await AiService().generate(
        firebaseIdToken: token,
        prompt: prompt,
        style: _style,
        purpose: _purpose,
        aspectRatio: _aspectRatio,
        propertySummary: _propertySummaryController.text.trim(),
      );
      if (mounted) {
        if (result != null) {
          setState(() {
            _resultDataUrl = result.imageDataUrl;
            _resultText = result.text;
          });
        } else {
          setState(() => _error = 'No image was returned. Try rephrasing.');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _saveToMedia() async {
    if (_resultDataUrl == null) return;
    setState(() => _saving = true);

    try {
      // Parse the data URL
      final parts = _resultDataUrl!.split(',');
      final header = parts[0];
      final base64Data = parts.length > 1 ? parts[1] : '';
      final mimeMatch = RegExp(r'data:([^;]+)').firstMatch(header);
      final mimeType = mimeMatch?.group(1) ?? 'image/png';

      final bytes = base64Decode(base64Data);

      final repo = MediaRepository();
      await repo.upload(
        bytes: bytes,
        contentType: mimeType,
        name: 'AI concept',
        source: 'ai',
        prompt: _promptController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saved to Media Library')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not save: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_checkingConfig) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Image Studio')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (!AiConfig.isConfigured || !_configured) {
      return Scaffold(
        appBar: AppBar(title: const Text('AI Image Studio')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome, size: 48, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(height: 16),
                Text(
                  'AI generation is not configured',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'This deployment has no Gemini API key. Configure ESTATEFLOW_AI_API_URL '
                  'to point to a deployed EstateFlow web app with GEMINI_API_KEY set.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('AI Image Studio')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Prompt
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Prompt',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _promptController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Describe the image you want...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _propertySummaryController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Property context (optional)',
                      hintText: 'e.g. 3-bed apartment in Lahore',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Style picker
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Style',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _styles.map((style) {
                      return ChoiceChip(
                        label: Text(style.$2),
                        selected: _style == style.$1,
                        onSelected: (_) => setState(() => _style = style.$1),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Purpose picker
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Purpose',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _purposes.map((purpose) {
                      return ChoiceChip(
                        label: Text(purpose.$2),
                        selected: _purpose == purpose.$1,
                        onSelected: (_) => setState(() => _purpose = purpose.$1),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Aspect ratio picker
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Aspect ratio',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _aspectRatios.map((ratio) {
                      return ChoiceChip(
                        label: Text(ratio.$2),
                        selected: _aspectRatio == ratio.$1,
                        onSelected: (_) => setState(() => _aspectRatio = ratio.$1),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Generate button
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _generating ? null : _generate,
              icon: _generating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(_generating ? 'Generating...' : 'Generate'),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _error!,
                style: TextStyle(color: theme.colorScheme.onErrorContainer),
              ),
            ),
          ],
          if (_resultDataUrl != null) ...[
            const SizedBox(height: 16),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  Image.memory(
                    base64Decode(_resultDataUrl!.split(',').last),
                    fit: BoxFit.contain,
                  ),
                  if (_resultText != null) ...[
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        _resultText!,
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                  ],
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _saving ? null : _saveToMedia,
                        icon: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.save_outlined),
                        label: Text(_saving ? 'Saving...' : 'Save to Media Library'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}