import 'package:intl/intl.dart';

final _moneyFmt = NumberFormat('#,###', 'uz');

String formatMoney(double amount) {
  return '${_moneyFmt.format(amount.round())} so\'m';
}

String formatCompact(double amount) {
  if (amount >= 1000000) {
    return '${(amount / 1000000).toStringAsFixed(1)} mln';
  }
  if (amount >= 1000) {
    return '${(amount / 1000).toStringAsFixed(0)} ming';
  }
  return amount.toStringAsFixed(0);
}

String formatDate(String isoString) {
  try {
    final dt = DateTime.parse(isoString);
    return DateFormat('dd.MM.yyyy').format(dt);
  } catch (_) {
    return isoString;
  }
}

String formatDateTime(String isoString) {
  try {
    final dt = DateTime.parse(isoString);
    return DateFormat('dd.MM.yyyy HH:mm').format(dt);
  } catch (_) {
    return isoString;
  }
}

String formatTime(String isoString) {
  try {
    final dt = DateTime.parse(isoString);
    return DateFormat('HH:mm').format(dt);
  } catch (_) {
    return isoString;
  }
}

String generateId() {
  return DateTime.now().millisecondsSinceEpoch.toString() +
      (DateTime.now().microsecond % 1000).toString();
}

String formatElapsed(String startIso) {
  try {
    final start = DateTime.parse(startIso);
    final diff = DateTime.now().difference(start);
    final mins = diff.inMinutes;
    if (mins < 1) return 'Hozirgina';
    if (mins < 60) return '$mins daqiqa';
    final h = diff.inHours;
    final m = mins % 60;
    return m > 0 ? '$h soat $m daqiqa' : '$h soat';
  } catch (_) {
    return '';
  }
}

String qtyLabel(double qty, String unit) {
  switch (unit) {
    case 'kg':
      return '$qty kg';
    case 'gr':
      return '${qty.toInt()} gr';
    default:
      return '${qty.toInt()} ta';
  }
}

double calcSubtotal(String unit, double qty, double price) {
  switch (unit) {
    case 'kg':
      return qty * price;
    case 'gr':
      return (qty / 1000) * price;
    default:
      return qty * price;
  }
}
