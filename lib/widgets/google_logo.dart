import 'package:flutter/material.dart';

/// The Google "G" mark, drawn so the app does not need an asset dependency.
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 20});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final stroke = w * 0.19;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(stroke / 2, stroke / 2, w - stroke, h - stroke);
    final center = Offset(w / 2, h / 2);
    final radius = (w - stroke) / 2;

    // Blue arc (top right).
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -1.5708, 1.5708, false, paint);

    // Green arc (bottom right).
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 0, 1.5708, false, paint);

    // Yellow arc (bottom left).
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, 1.5708, 1.5708, false, paint);

    // Red arc (top left).
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, 3.1416, 1.5708, false, paint);

    // Blue horizontal bar.
    paint.color = const Color(0xFF4285F4);
    paint.strokeCap = StrokeCap.butt;
    canvas.drawLine(
      Offset(center.dx, center.dy),
      Offset(w - stroke / 2, center.dy),
      paint,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy),
      Offset(center.dx, center.dy - radius),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
