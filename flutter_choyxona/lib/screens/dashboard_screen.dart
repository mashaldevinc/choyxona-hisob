import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import 'quick_sale_screen.dart';
import 'order_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final profile = prov.profile;
    final active = prov.activeSessions;
    final today = DateTime.now();

    // Today income from closed sessions
    double todayIncome = 0;
    for (final s in prov.sessions) {
      if (s.status == 'closed') {
        try {
          final dt = DateTime.parse(s.startTime);
          if (dt.year == today.year && dt.month == today.month && dt.day == today.day) {
            todayIncome += prov.sessionBill(s.id);
          }
        } catch (_) {}
      }
    }
    // Quick sales today
    for (final qs in prov.quickSales) {
      try {
        final dt = DateTime.parse(qs.createdAt);
        if (dt.year == today.year && dt.month == today.month && dt.day == today.day) {
          todayIncome += qs.total;
        }
      } catch (_) {}
    }

    // Undelivered alerts
    final alerts = active.where((s) {
      final items = prov.getOrders(s.id);
      final hasUndelivered = items.any((o) => !o.isDelivered);
      return hasUndelivered || s.reason == 'nosoz' || s.reason == 'bron';
    }).toList();

    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(profile?.name ?? 'Choyxona',
                              style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  color: cs.onSurface)),
                          Text("Bugungi kundashlik",
                              style: TextStyle(
                                  fontSize: 13,
                                  color: cs.onSurface.withOpacity(0.55))),
                        ],
                      ),
                    ),
                    // Dark mode toggle
                    GestureDetector(
                      onTap: () => context.read<AppProvider>().setDarkMode(!prov.isDarkMode),
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: cs.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: cs.outline),
                        ),
                        child: Icon(prov.isDarkMode ? Icons.light_mode : Icons.dark_mode,
                            color: cs.onSurface, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Stats row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  children: [
                    _StatCard(
                      label: "Bugungi daromad",
                      value: formatMoney(todayIncome),
                      icon: Icons.trending_up,
                      color: kSuccess,
                    ),
                    const SizedBox(width: 10),
                    _StatCard(
                      label: "Faol stollar",
                      value: '${active.length}',
                      icon: Icons.table_restaurant,
                      color: kPrimary,
                    ),
                    const SizedBox(width: 10),
                    _StatCard(
                      label: "Jami qarz",
                      value: formatCompact(prov.totalDebtRemaining),
                      icon: Icons.account_balance_wallet,
                      color: kDestructive,
                    ),
                  ],
                ),
              ),
            ),

            // Alerts
            if (alerts.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active, color: kWarning, size: 18),
                      const SizedBox(width: 6),
                      Text('Eslatmalar (${alerts.length})',
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 16)),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final s = alerts[i];
                      final undelCount = prov
                          .getOrders(s.id)
                          .where((o) => !o.isDelivered)
                          .length;
                      return _AlertCard(
                        session: s,
                        undeliveredCount: undelCount,
                        onTap: s.reason != 'nosoz'
                            ? () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => OrderScreen(sessionId: s.id)),
                                )
                            : null,
                      );
                    },
                    childCount: alerts.length,
                  ),
                ),
              ),
            ],

            // Active sessions
            if (active.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                  child: Text('Faol Stollar',
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: cs.onSurface)),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final s = active[i];
                      final total = prov.sessionBill(s.id);
                      return _SessionCard(
                        session: s,
                        total: total,
                        onTap: s.reason != 'nosoz'
                            ? () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => OrderScreen(sessionId: s.id)),
                                )
                            : null,
                      );
                    },
                    childCount: active.length,
                  ),
                ),
              ),
            ],

            const SliverToBoxAdapter(child: SizedBox(height: 120)),
          ],
        ),
      ),

      // FAB — Quick sale
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const QuickSaleScreen()),
        ),
        backgroundColor: kPrimary,
        icon: const Icon(Icons.flash_on, color: Colors.white),
        label: const Text("Tezkor sotuv",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

// ─── Widgets ──────────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label, required this.value,
    required this.icon, required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cs.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 8),
            Text(value,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 10,
                    color: cs.onSurface.withOpacity(0.5))),
          ],
        ),
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  final dynamic session;
  final int undeliveredCount;
  final VoidCallback? onTap;

  const _AlertCard({
    required this.session,
    required this.undeliveredCount,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: kWarning.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kWarning.withOpacity(0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber, color: kWarning, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(session.locationName,
                      style: TextStyle(
                          fontWeight: FontWeight.w700, color: cs.onSurface)),
                  if (undeliveredCount > 0)
                    Text('$undeliveredCount mahsulot yetkazilmagan',
                        style: const TextStyle(fontSize: 12, color: kWarning)),
                  if (session.reason == 'nosoz')
                    const Text('Nosoz / Rezerv',
                        style: TextStyle(fontSize: 12, color: kWarning)),
                  if (session.reason == 'bron' && undeliveredCount == 0)
                    const Text('Bron qilingan',
                        style: TextStyle(fontSize: 12, color: kWarning)),
                ],
              ),
            ),
            if (onTap != null)
              const Icon(Icons.arrow_forward_ios, size: 14, color: kWarning),
          ],
        ),
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final dynamic session;
  final double total;
  final VoidCallback? onTap;

  const _SessionCard({
    required this.session, required this.total, this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isSpecial = session.reason == 'nosoz' || session.reason == 'bron';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isSpecial ? kWarning.withOpacity(0.5) : cs.outline),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSpecial
                    ? kWarning.withOpacity(0.15)
                    : kPrimary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                session.reason == 'nosoz'
                    ? Icons.build
                    : session.reason == 'bron'
                        ? Icons.bookmark
                        : Icons.table_restaurant,
                size: 18,
                color: isSpecial ? kWarning : kPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(session.locationName,
                      style: TextStyle(
                          fontWeight: FontWeight.w700, color: cs.onSurface)),
                  Text(
                    session.reason == 'nosoz'
                        ? 'Nosoz / Rezerv'
                        : '${session.guestCount} mehmon · ${formatTime(session.startTime)}',
                    style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurface.withOpacity(0.55)),
                  ),
                ],
              ),
            ),
            if (session.reason != 'nosoz') ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatMoney(total),
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface,
                          fontSize: 13)),
                  const Icon(Icons.arrow_forward_ios, size: 12),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
