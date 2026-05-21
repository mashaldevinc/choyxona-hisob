import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';

class ReceiptsScreen extends StatefulWidget {
  const ReceiptsScreen({super.key});

  @override
  State<ReceiptsScreen> createState() => _ReceiptsScreenState();
}

class _ReceiptsScreenState extends State<ReceiptsScreen> {
  String _filter = 'barchasi'; // barchasi | cheklar | tezkor

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;

    // Build combined list sorted by date desc
    final closedSessions = prov.sessions
        .where((s) => s.status == 'closed')
        .map((s) => _ReceiptItem(
              id: s.id,
              title: s.locationName,
              subtitle: '${s.guestCount} mehmon',
              total: prov.sessionBill(s.id),
              date: s.startTime,
              type: 'chek',
            ))
        .toList();

    final quickItems = prov.quickSales
        .map((qs) => _ReceiptItem(
              id: qs.id,
              title: qs.buyerName ?? 'Xaridor',
              subtitle: '${qs.items.length} ta mahsulot · ${qs.paymentType == 'naqd' ? 'Naqd' : 'Qarz'}',
              total: qs.total,
              date: qs.createdAt,
              type: 'tezkor',
            ))
        .toList();

    final allItems = <_ReceiptItem>[];
    if (_filter != 'tezkor') allItems.addAll(closedSessions);
    if (_filter != 'cheklar') allItems.addAll(quickItems);
    allItems.sort((a, b) => b.date.compareTo(a.date));

    double totalIncome = allItems.fold(0, (s, r) => s + r.total);

    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Cheklar',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: cs.onSurface)),
                  Text('${allItems.length} ta yozuv',
                      style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
                  const SizedBox(height: 14),
                  // Income summary
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: kSuccess.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kSuccess.withOpacity(0.25)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 38, height: 38,
                          decoration: BoxDecoration(
                            color: kSuccess.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.trending_up, color: kSuccess, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Jami daromad',
                                style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                            Text(formatMoney(totalIncome),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 18, color: kSuccess)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Filter tabs
                  Row(
                    children: [
                      _chip(context, 'barchasi', 'Barchasi'),
                      const SizedBox(width: 8),
                      _chip(context, 'cheklar', 'Cheklar'),
                      const SizedBox(width: 8),
                      _chip(context, 'tezkor', 'Tezkor sotuv'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: allItems.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 48, color: cs.onSurface.withOpacity(0.2)),
                          const SizedBox(height: 12),
                          Text('Hali chek yo\'q',
                              style: TextStyle(color: cs.onSurface.withOpacity(0.5))),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: allItems.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _ReceiptCard(item: allItems[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(BuildContext context, String val, String label) {
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

class _ReceiptItem {
  final String id;
  final String title;
  final String subtitle;
  final double total;
  final String date;
  final String type; // chek | tezkor

  _ReceiptItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.total,
    required this.date,
    required this.type,
  });
}

class _ReceiptCard extends StatelessWidget {
  final _ReceiptItem item;
  const _ReceiptCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isQuick = item.type == 'tezkor';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: (isQuick ? kWarning : kPrimary).withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isQuick ? Icons.flash_on : Icons.receipt_long,
              size: 18,
              color: isQuick ? kWarning : kPrimary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title,
                    style: TextStyle(fontWeight: FontWeight.w600, color: cs.onSurface)),
                Text(item.subtitle,
                    style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                Text(formatDateTime(item.date),
                    style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.4))),
              ],
            ),
          ),
          Text(formatMoney(item.total),
              style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                  fontSize: 14)),
        ],
      ),
    );
  }
}
