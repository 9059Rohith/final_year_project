import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class GradientButton extends StatefulWidget {
  final String label;
  final LinearGradient gradient;
  final VoidCallback? onTap;
  final bool isLoading;
  final double height;
  final Widget? icon;

  const GradientButton({
    super.key,
    required this.label,
    required this.gradient,
    this.onTap,
    this.isLoading = false,
    this.height = 58,
    this.icon,
  });

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 120));
    _scale = Tween<double>(begin: 1, end: 0.96).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => _ctrl.forward() : null,
      onTapUp: widget.onTap != null
          ? (_) {
              _ctrl.reverse();
              widget.onTap?.call();
            }
          : null,
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (ctx, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          height: widget.height,
          decoration: BoxDecoration(
            gradient: widget.onTap != null
                ? widget.gradient
                : const LinearGradient(colors: [Color(0xFFCCCCCC), Color(0xFFBBBBBB)]),
            borderRadius: BorderRadius.circular(18),
            boxShadow: widget.onTap != null
                ? [
                    BoxShadow(
                      color: widget.gradient.colors.first.withOpacity(0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.icon != null) ...[
                        widget.icon!,
                        const SizedBox(width: 10),
                      ],
                      Text(
                        widget.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// ── Outline Button ────────────────────────────────────────────────────────────
class OutlineButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback? onTap;
  final double height;

  const OutlineButton({
    super.key,
    required this.label,
    required this.color,
    this.onTap,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color, width: 2),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Icon Circle Button ────────────────────────────────────────────────────────
class CircleIconButton extends StatelessWidget {
  final IconData icon;
  final Color bg;
  final Color iconColor;
  final double size;
  final VoidCallback? onTap;

  const CircleIconButton({
    super.key,
    required this.icon,
    required this.bg,
    this.iconColor = Colors.white,
    this.size = 56,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: bg.withOpacity(0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: size * 0.45),
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .scale(begin: const Offset(1, 1), end: const Offset(1.04, 1.04), duration: 1400.ms, curve: Curves.easeInOut);
  }
}
