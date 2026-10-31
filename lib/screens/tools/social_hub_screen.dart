import 'package:flutter/material.dart';

import '../../services/social_repository.dart';
import '../../models/social_post.dart';

/// Social Media Hub screen for composing captions, hashtags, and saving drafts.
class SocialHubScreen extends StatefulWidget {
  const SocialHubScreen({super.key, this.repository});

  final SocialRepository? repository;

  @override
  State<SocialHubScreen> createState() => _SocialHubScreenState();
}

class _SocialHubScreenState extends State<SocialHubScreen> {
  late final SocialRepository _repository =
      widget.repository ?? SocialRepository();

  final _captionController = TextEditingController();
  final _hashtagsController = TextEditingController();
  final _destinations = <String>[];
  bool _saving = false;
  String? _error;

  static const _platforms = [
    ('facebook', 'Facebook Pages'),
    ('instagram', 'Instagram'),
    ('linkedin', 'LinkedIn'),
    ('pinterest', 'Pinterest'),
    ('tiktok', 'TikTok'),
    ('x', 'X'),
  ];

  @override
  void dispose() {
    _captionController.dispose();
    _hashtagsController.dispose();
    super.dispose();
  }

  Future<void> _saveDraft() async {
    final caption = _captionController.text.trim();
    if (caption.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a caption to save a draft.')),
      );
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await _repository.createDraft(
        caption: caption,
        hashtags: _hashtagsController.text,
        destinations: List.from(_destinations),
      );
      if (mounted) {
        _captionController.clear();
        _hashtagsController.clear();
        setState(() => _destinations.clear());
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Draft saved')),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deletePost(SocialPost post) async {
    try {
      await _repository.delete(post.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Draft deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not delete: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Social Media Hub')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Compose section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Compose',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _captionController,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Caption',
                            hintText: 'Write your post caption...',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _hashtagsController,
                          decoration: const InputDecoration(
                            labelText: 'Hashtags',
                            hintText: '#realestate #property ...',
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Destinations',
                          style: theme.textTheme.labelMedium,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _platforms.map((platform) {
                            final selected = _destinations.contains(platform.$1);
                            return FilterChip(
                              label: Text(platform.$2),
                              selected: selected,
                              onSelected: (value) {
                                setState(() {
                                  if (value) {
                                    _destinations.add(platform.$1);
                                  } else {
                                    _destinations.remove(platform.$1);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 16),
                        if (_error != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Text(
                              _error!,
                              style: TextStyle(color: theme.colorScheme.error),
                            ),
                          ),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: _saving ? null : _saveDraft,
                            icon: _saving
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.save_outlined),
                            label: Text(_saving ? 'Saving...' : 'Save draft'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Draft only. No account is connected and nothing is published. '
                            'Connecting platforms requires OAuth apps, encrypted token storage, '
                            'a publisher worker, and Cloud Scheduler.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Drafts section
                Text(
                  'Drafts',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                StreamBuilder<List<SocialPost>>(
                  stream: _repository.watchAll(),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Text(
                          'Could not load drafts.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      );
                    }

                    final posts = snapshot.data ?? [];
                    if (posts.isEmpty) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.drafts_outlined,
                                size: 48,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No drafts yet',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Compose a post and save it as a draft.',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    return Column(
                      children: posts.map((post) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        post.caption,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: theme.textTheme.bodyMedium,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18),
                                      onPressed: () => _deletePost(post),
                                      tooltip: 'Delete',
                                    ),
                                  ],
                                ),
                                if (post.hashtags.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    post.hashtags,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                ],
                                if (post.destinations.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Wrap(
                                    spacing: 4,
                                    children: post.destinations.map((d) {
                                      return Chip(
                                        label: Text(d),
                                        visualDensity: VisualDensity.compact,
                                      );
                                    }).toList(),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Chip(
                                      label: Text(post.status),
                                      visualDensity: VisualDensity.compact,
                                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Not sent',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}