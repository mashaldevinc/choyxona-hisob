import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import 'debt_detail_screen.dart';

class DebtsScreen extends StatefulWidget {
  const DebtsScreen({super.key});

  @override
  State<DebtsScreen> createState() => _DebtsScreenState();
}

class _DebtsScreenState extends State<DebtsScreen> {
  String _filter = 'barchasi'; // barchasi | tolanmagan | toliq

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;

    final filtered = prov.debts.where((d) {
      if (_filter == 'tolanmagan') return d.status != 'toliq';
      if (_filter == 'toliq') return d.status == 'toliq';
      return true;
    }).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final totalRemaining = prov.totalDebtRemaining;
    final activeCount = prov.debts.where((d) => d.status != 'toliq').length;

    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Qarz Daftar',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: cs.onSurface)),
                  Text('$activeCount ta to\'lanmagan qarz',
                      style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
                  const SizedBox(height: 14),
                  // Summary
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: kDestructive.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kDestructive.withOpacity(0.25)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: kDestructive.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.account_balance_wallet,
                              color: kDestructive, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Jami to'lanmagan",
                                style: TextStyle(
                                    fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                            Text(formatMoney(totalRemaining),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 18,
                                    color: kDestructive)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Filter tabs
                  Row(
                    children: [
                      _filterChip(context, 'barchasi', 'Barchasi'),
                      const SizedBox(width: 8),
                      _filterChip(context, 'tolanmagan', "To'lanmagan"),
                      const SizedBox(width: 8),
                      _filterChip(context, 'toliq', "To'langan"),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // List
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 72, height: 72,
                            decoration: BoxDecoration(
                              color: kPrimary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(36),
                            ),
                            child: const Icon(Icons.book, color: kPrimary, size: 32),
                          ),
                          const SizedBox(height: 16),
                          Text('Qarz yo\'q',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) => _DebtCard(
                        debt: filtered[i],
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => DebtDetailScreen(debtId: filtered[i].id)),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(BuildContext context, String val, String label) {
    final cs = Theme.of(context).colorScheme;
    final sel = _filter == val;
    return GestureDetector(
      onTap: () => setState(() => _filter = val),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: sel ? kPrimary : cs.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? kPrimary : cs.outline),
        ),
        child: Text(label,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: sel ? Colors.white : cs.onSurface)),
      ),
    );
  }
}

class _DebtCard extends StatelessWidget {
  final Debt debt;
  final VoidCallback onTap;

  const _DebtCard({required this.debt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final pct = debt.totalDebt > 0 ? debt.paidAmount / debt.totalDebt : 0.0;
    final statusColor = debt.status == 'toliq'
        ? kSuccess
        : debt.status == 'qisman'
            ? kWarning
            : kDestructive;
    final statusLabel = debt.status == 'toliq'
        ? "To'langan"
        : debt.status == 'qisman'
            ? "Qisman"
            : "To'lanmagan";

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cs.outline),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(21),
                  ),
                  child: const Icon(Icons.person, size: 20, color: kPrimary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(debt.debtorName,
                          style: TextStyle(fontWeight: FontWeight.w700, color: cs.onSurface)),
                      Text(formatDate(debt.createdAt),
                          style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(statusLabel,
                      style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct.toDouble(),
                backgroundColor: cs.outline,
                valueColor: AlwaysStoppedAnimation(statusColor),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _amount(context, 'Jami', debt.totalDebt, cs.onSurface),
                _amount(context, "To'langan", debt.paidAmount, kSuccess),
                _amount(context, 'Qoldiq', debt.remainingAmount, kDestructive),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _amount(BuildContext context, String label, double val, Color color) {
    return Column(
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 10,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
        const SizedBox(height: 2),
        Text(formatMoney(val),
            style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 13)),
      ],
    );
  }
}
