import 'package:flutter/material.dart';

const _logoLight = 'assets/branding/estateflow_logo.png';
const _logoDark = 'assets/branding/estateflow_logo_dark.png';
const _symbolLight = 'assets/branding/estateflow_symbol.png';
const _symbolDark = 'assets/branding/estateflow_symbol_dark.png';
const _appIcon = 'assets/branding/estateflow_app_icon.png';

/// Full EstateFlow lockup with the official tagline.
class EstateFlowLogo extends StatelessWidget {
  const EstateFlowLogo({
    super.key,
    this.width = 220,
    this.semanticLabel = 'EstateFlow — Find, Manage, Grow',
  });

  final double width;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Image.asset(
      dark ? _logoDark : _logoLight,
      width: width,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      semanticLabel: semanticLabel,
      errorBuilder: (context, error, stackTrace) => _LogoFallback(width: width),
    );
  }
}

/// Compact EstateFlow house mark for app bars and small surfaces.
class EstateFlowSymbol extends StatelessWidget {
  const EstateFlowSymbol({
    super.key,
    this.size = 28,
    this.semanticLabel = 'EstateFlow',
  });

  final double size;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Image.asset(
      dark ? _symbolDark : _symbolLight,
      width: size,
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      semanticLabel: semanticLabel,
      errorBuilder: (context, error, stackTrace) => Icon(
        Icons.home_work_outlined,
        size: size,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

/// Rounded app icon for about/settings surfaces.
class EstateFlowAppIcon extends StatelessWidget {
  const EstateFlowAppIcon({
    super.key,
    this.size = 48,
    this.semanticLabel = 'EstateFlow app icon',
  });

  final double size;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      _appIcon,
      width: size,
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      semanticLabel: semanticLabel,
      errorBuilder: (context, error, stackTrace) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary,
          borderRadius: BorderRadius.circular(size * 0.22),
        ),
        child: Icon(
          Icons.home_work_outlined,
          color: Colors.white,
          size: size * 0.56,
        ),
      ),
    );
  }
}

class _LogoFallback extends StatelessWidget {
  const _LogoFallback({required this.width});

  final double width;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.home_work_outlined,
          color: theme.colorScheme.primary,
          size: width * 0.2,
        ),
        SizedBox(width: width * 0.04),
        Flexible(
          child: Text(
            'EstateFlow',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
              color: theme.colorScheme.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
