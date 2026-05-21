import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import '../widgets/qty_stepper.dart';

class OrderScreen extends StatefulWidget {
  final String sessionId;
  const OrderScreen({super.key, required this.sessionId});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  String _selectedCategory = 'Barchasi';
  TemplateItem? _selectedTemplate;
  String? _selectedVariant;
  double _qty = 1;

  void _showAddItem(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddItemModal(
        sessionId: widget.sessionId,
        onAdded: () => setState(() {}),
      ),
    );
  }

  void _showCheckout(BuildContext context) {
    final prov = context.read<AppProvider>();
    final total = prov.sessionBill(widget.sessionId);
    String payType = 'naqd';
    final nameCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setModalState) {
          final cs = Theme.of(ctx2).colorScheme;
          return Container(
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.fromLTRB(
                20, 12, 20, MediaQuery.of(ctx2).viewInsets.bottom + 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36, height: 4,
                    decoration: BoxDecoration(
                      color: cs.outline,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Hisobni yopish',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: kPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Jami to'lov:", style: TextStyle(color: cs.onSurface, fontWeight: FontWeight.w600)),
                      Text(formatMoney(total),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: kPrimary)),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text("TO'LOV TURI",
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                        color: cs.onSurface.withOpacity(0.5), letterSpacing: 0.7)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _payChip(ctx2, 'naqd', 'Naqd pul', payType, (v) => setModalState(() => payType = v)),
                    const SizedBox(width: 10),
                    _payChip(ctx2, 'qarz', 'Qarzga', payType, (v) => setModalState(() => payType = v)),
                  ],
                ),
                if (payType == 'qarz') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(hintText: 'Qarzdor ismi (ixtiyoriy)'),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await prov.checkoutSession(
                        sessionId: widget.sessionId,
                        paymentType: payType,
                        buyerName: nameCtrl.text.trim().isEmpty ? null : nameCtrl.text.trim(),
                      );
                      if (ctx2.mounted) Navigator.pop(ctx2);
                      if (mounted) Navigator.pop(context);
                    },
                    child: const Text("Hisobni yopish"),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _payChip(BuildContext context, String val, String label, String current, ValueChanged<String> onChange) {
    final cs = Theme.of(context).colorScheme;
    final sel = val == current;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChange(val),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: sel ? kPrimary : cs.background,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: sel ? kPrimary : cs.outline),
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: sel ? Colors.white : cs.onSurface)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final session = prov.getSession(widget.sessionId);
    if (session == null) {
      return Scaffold(body: Center(child: Text('Sessiya topilmadi', style: TextStyle(color: cs.onSurface))));
    }
    final orderItems = prov.getOrders(widget.sessionId);
    final total = prov.sessionBill(widget.sessionId);
    final undelivered = orderItems.where((o) => !o.isDelivered).toList();

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(
        title: Text(session.locationName),
        actions: [
          if (undelivered.isNotEmpty)
            TextButton.icon(
              onPressed: () => prov.markAllDelivered(widget.sessionId),
              icon: const Icon(Icons.check_circle, color: kSuccess, size: 18),
              label: const Text('Barchasini yetkazish',
                  style: TextStyle(color: kSuccess, fontSize: 12)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Session info bar
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: cs.outline),
            ),
            child: Row(
              children: [
                Icon(Icons.people, size: 16, color: kPrimary),
                const SizedBox(width: 6),
                Text('${session.guestCount} mehmon',
                    style: TextStyle(fontWeight: FontWeight.w600, color: cs.onSurface)),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 14, color: cs.onSurface.withOpacity(0.5)),
                const SizedBox(width: 4),
                Text(formatElapsed(session.startTime),
                    style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.55))),
                const Spacer(),
                if (undelivered.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: kWarning.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('${undelivered.length} kutmoqda',
                        style: const TextStyle(fontSize: 11, color: kWarning, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // Order items
          Expanded(
            child: orderItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long, size: 48, color: cs.onSurface.withOpacity(0.2)),
                        const SizedBox(height: 12),
                        Text("Hali buyurtma yo'q",
                            style: TextStyle(color: cs.onSurface.withOpacity(0.5))),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _showAddItem(context),
                          icon: const Icon(Icons.add),
                          label: const Text('Buyurtma qo\'shish'),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 140),
                    itemCount: orderItems.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final item = orderItems[i];
                      return _OrderItemCard(
                        item: item,
                        onDeliver: () => prov.markDelivered(widget.sessionId, item.id),
                        onDelete: () => prov.removeOrderItem(widget.sessionId, item.id),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border(top: BorderSide(color: cs.outline)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Jami hisob',
                      style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                  Text(formatMoney(total),
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton.icon(
              onPressed: () => _showAddItem(context),
              icon: const Icon(Icons.add, size: 16),
              label: const Text("Qo'shish"),
              style: ElevatedButton.styleFrom(
                backgroundColor: cs.secondary,
                foregroundColor: kPrimary,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: orderItems.isNotEmpty ? () => _showCheckout(context) : null,
              icon: const Icon(Icons.check, size: 16),
              label: const Text('Yopish'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderItemCard extends StatelessWidget {
  final OrderItem item;
  final VoidCallback onDeliver;
  final VoidCallback onDelete;

  const _OrderItemCard({
    required this.item, required this.onDeliver, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: item.isDelivered ? kSuccess.withOpacity(0.06) : cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: item.isDelivered ? kSuccess.withOpacity(0.3) : cs.outline,
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: item.isDelivered ? null : onDeliver,
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: item.isDelivered
                    ? kSuccess.withOpacity(0.2)
                    : cs.secondary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                item.isDelivered ? Icons.check : Icons.hourglass_empty,
                size: 15,
                color: item.isDelivered ? kSuccess : kPrimary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name + (item.variant != null ? ' (${item.variant})' : ''),
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: item.isDelivered
                        ? cs.onSurface.withOpacity(0.5)
                        : cs.onSurface,
                    decoration: item.isDelivered ? TextDecoration.lineThrough : null,
                  ),
                ),
                Text(qtyLabel(item.qtyOrWeight, item.unit),
                    style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.5))),
              ],
            ),
          ),
          Text(formatMoney(item.subtotal),
              style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: item.isDelivered ? cs.onSurface.withOpacity(0.4) : cs.onSurface)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onDelete,
            child: Icon(Icons.close, size: 18, color: cs.onSurface.withOpacity(0.35)),
          ),
        ],
      ),
    );
  }
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
class _AddItemModal extends StatefulWidget {
  final String sessionId;
  final VoidCallback onAdded;

  const _AddItemModal({required this.sessionId, required this.onAdded});

  @override
  State<_AddItemModal> createState() => _AddItemModalState();
}

class _AddItemModalState extends State<_AddItemModal> {
  String _cat = 'Barchasi';
  TemplateItem? _selected;
  String? _variant;
  double _qty = 1;

  void _add(BuildContext context) {
    if (_selected == null) return;
    final price = _selected!.effectivePrice(_variant);
    final subtotal = calcSubtotal(_selected!.unit, _qty, price);
    final item = OrderItem(
      id: generateId(),
      name: _selected!.name,
      variant: _variant,
      unit: _selected!.unit,
      qtyOrWeight: _qty,
      price: price,
      subtotal: subtotal,
    );
    context.read<AppProvider>().addOrderItem(widget.sessionId, item);
    widget.onAdded();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final cats = ['Barchasi', ...prov.categories];
    final filtered = _cat == 'Barchasi'
        ? prov.templates
        : prov.templates.where((t) => t.category == _cat).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle + title
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Column(
              children: [
                Center(
                  child: Container(
                    width: 36, height: 4,
                    decoration: BoxDecoration(
                      color: cs.outline, borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Text('Buyurtma qo\'shish',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const Spacer(),
                    if (_selected != null)
                      ElevatedButton(onPressed: () => _add(context), child: const Text("Qo'shish")),
                  ],
                ),
              ],
            ),
          ),
          // Category tabs
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              itemCount: cats.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final c = cats[i];
                final sel = c == _cat;
                return GestureDetector(
                  onTap: () => setState(() { _cat = c; _selected = null; }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: sel ? kPrimary : cs.background,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: sel ? kPrimary : cs.outline),
                    ),
                    child: Text(c,
                        style: TextStyle(
                            color: sel ? Colors.white : cs.onSurface,
                            fontWeight: FontWeight.w500,
                            fontSize: 13)),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // Template list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final t = filtered[i];
                final sel = _selected?.id == t.id;
                return GestureDetector(
                  onTap: () => setState(() {
                    _selected = t;
                    _variant = t.variants.isNotEmpty ? t.variants.first : null;
                    _qty = t.unit == 'gr' ? 100 : (t.unit == 'kg' ? 0.5 : 1);
                  }),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: sel ? kPrimary.withOpacity(0.08) : cs.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: sel ? kPrimary : cs.outline),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(t.name,
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: cs.onSurface)),
                            ),
                            if (t.priceStatus == 'pullik')
                              Text(formatMoney(t.basePrice),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700, color: kPrimary, fontSize: 13)),
                            if (t.priceStatus == 'bepul')
                              const Text('Bepul',
                                  style: TextStyle(color: kSuccess, fontWeight: FontWeight.w600, fontSize: 13)),
                          ],
                        ),
                        // Variants + qty stepper when selected
                        if (sel) ...[
                          if (t.variants.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              children: t.variants.map((v) {
                                final vSel = v == _variant;
                                final vPrice = t.variantPrices[v] ?? t.basePrice;
                                return GestureDetector(
                                  onTap: () => setState(() => _variant = v),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: vSel ? kPrimary : cs.surface,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: vSel ? kPrimary : cs.outline),
                                    ),
                                    child: Text('$v — ${formatMoney(vPrice)}',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: vSel ? Colors.white : cs.onSurface,
                                            fontWeight: FontWeight.w500)),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              QtyStepper(
                                value: _qty,
                                unit: t.unit,
                                onChanged: (v) => setState(() => _qty = v),
                              ),
                              if (t.priceStatus == 'pullik')
                                Text(
                                  formatMoney(calcSubtotal(t.unit, _qty, t.effectivePrice(_variant))),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700, color: kPrimary, fontSize: 14),
                                ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
