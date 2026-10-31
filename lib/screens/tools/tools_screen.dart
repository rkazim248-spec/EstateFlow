import 'package:flutter/material.dart';

import 'ai_studio_screen.dart';
import 'media_library_screen.dart';
import 'social_hub_screen.dart';

/// Hub screen listing the mobile tools: AI Image Studio, Media Library and
/// Social Media Hub.
import '../../services/auth_service.dart';

class ToolsScreen extends StatelessWidget {
  const ToolsScreen({super.key, this.authService});

  final AuthService? authService;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Tools')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ToolTile(
            icon: Icons.auto_awesome,
            title: 'AI Image Studio',
            subtitle: 'Generate marketing images with Gemini',
            color: theme.colorScheme.primary,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => AiStudioScreen(authService: authService)),
            ),
          ),
          const SizedBox(height: 12),
          _ToolTile(
            icon: Icons.photo_library_outlined,
            title: 'Media Library',
            subtitle: 'Upload and manage images in Firebase Storage',
            color: theme.colorScheme.secondary,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MediaLibraryScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _ToolTile(
            icon: Icons.share_outlined,
            title: 'Social Media Hub',
            subtitle: 'Compose captions, hashtags and save drafts',
            color: theme.colorScheme.tertiary,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SocialHubScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolTile extends StatelessWidget {
  const _ToolTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}