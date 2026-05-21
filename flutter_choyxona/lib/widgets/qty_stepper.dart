import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class QtyStepper extends StatelessWidget {
  final double value;
  final String unit;
  final ValueChanged<double> onChanged;

  const QtyStepper({
    super.key,
    required this.value,
    required this.unit,
    required this.onChanged,
  });

  double get _step {
    switch (unit) {
      case 'kg':
        return 0.1;
      case 'gr':
        return 50;
      default:
        return 1;
    }
  }

  String get _display {
    switch (unit) {
      case 'kg':
        return value.toStringAsFixed(1);
      case 'gr':
        return value.toInt().toString();
      default:
        return value.toInt().toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _StepBtn(
          icon: Icons.remove,
          onTap: () {
            final next = (value - _step).clamp(
              unit == 'dona' ? 1 : (unit == 'gr' ? 50 : 0.1),
              9999.0,
            );
            onChanged(double.parse(next.toStringAsFixed(3)));
          },
          color: cs.secondary,
          iconColor: cs.onSecondary,
        ),
        Container(
          constraints: const BoxConstraints(minWidth: 56),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: cs.background,
            border: Border.all(color: cs.outline),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$_display $unit',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: cs.onSurface,
            ),
          ),
        ),
        _StepBtn(
          icon: Icons.add,
          onTap: () {
            final next = value + _step;
            onChanged(double.parse(next.toStringAsFixed(3)));
          },
          color: kPrimary,
          iconColor: Colors.white,
        ),
      ],
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final Color iconColor;

  const _StepBtn({
    required this.icon,
    required this.onTap,
    required this.color,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 18, color: iconColor),
      ),
    );
  }
}
