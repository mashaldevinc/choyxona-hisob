import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import '../widgets/qty_stepper.dart';

class QuickSaleScreen extends StatefulWidget {
  const QuickSaleScreen({super.key});

  @override
  State<QuickSaleScreen> createState() => _QuickSaleScreenState();
}

class _QuickSaleScreenState extends State<QuickSaleScreen> {
  final _buyerCtrl = TextEditingController();
  final List<QuickSaleItem> _items = [];
  String _payType = 'naqd';

  double get _total => _items.fold(0, (s, i) => s + i.subtotal);

  @override
  void dispose() {
    _buyerCtrl.dispose();
    super.dispose();
  }

  void _showAddItem(BuildContext context) {
    final prov = context.read<AppProvider>();
    if (prov.templates.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Avval Sozlashda mahsulot qo\'shing')),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _QuickAddModal(
        onAdd: (item) => setState(() => _items.add(item)),
      ),
    );
  }

  Future<void> _save(BuildContext context) async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kamida 1 ta mahsulot qo\'shing')),
      );
      return;
    }
    final sale = QuickSale(
      id: generateId(),
      buyerName: _buyerCtrl.text.trim().isEmpty ? null : _buyerCtrl.text.trim(),
      items: List.from(_items),
      total: _total,
      paymentType: _payType,
      createdAt: DateTime.now().toIso8601String(),
    );
    await context.read<AppProvider>().addQuickSale(sale);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(title: const Text('Tezkor Sotuv')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              children: [
                // Buyer name
                TextField(
                  controller: _buyerCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Xaridor ismi (ixtiyoriy)',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 16),

                // Items
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Mahsulotlar',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 16, color: cs.onSurface)),
                    TextButton.icon(
                      onPressed: () => _showAddItem(context),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text("Qo'shish"),
                      style: TextButton.styleFrom(foregroundColor: kPrimary),
                    ),
                  ],
                ),
                if (_items.isEmpty)
                  Container(
                    height: 100,
                    decoration: BoxDecoration(
                      color: cs.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cs.outline),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_shopping_cart,
                              color: cs.onSurface.withOpacity(0.25), size: 28),
                          const SizedBox(height: 6),
                          Text("Mahsulot qo'shilmagan",
                              style: TextStyle(color: cs.onSurface.withOpacity(0.4), fontSize: 13)),
                        ],
                      ),
                    ),
                  )
                else
                  ..._items.asMap().entries.map((e) {
                    final item = e.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: cs.outline),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name + (item.variant != null ? ' (${item.variant})' : ''),
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600, color: cs.onSurface),
                                ),
                                Text(
                                  '${qtyLabel(item.qty, item.unit)} · ${formatMoney(item.price)}',
                                  style: TextStyle(
                                      fontSize: 11, color: cs.onSurface.withOpacity(0.5)),
                                ),
                              ],
                            ),
                          ),
                          Text(formatMoney(item.subtotal),
                              style: TextStyle(
                                  fontWeight: FontWeight.w700, color: cs.onSurface)),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => setState(() => _items.removeAt(e.key)),
                            child: Icon(Icons.close, size: 18, color: cs.onSurface.withOpacity(0.35)),
                          ),
                        ],
                      ),
                    );
                  }),

                const SizedBox(height: 20),

                // Payment type
                Text("TO'LOV TURI",
                    style: TextStyle(
                        fontSize: 10, fontWeight: FontWeight.w700,
                        color: cs.onSurface.withOpacity(0.5), letterSpacing: 0.7)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _payChip(context, 'naqd', 'Naqd pul', Icons.payments),
                    const SizedBox(width: 10),
                    _payChip(context, 'qarz', 'Qarzga', Icons.account_balance_wallet),
                  ],
                ),
                if (_payType == 'qarz') ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: kWarning.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: kWarning.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: kWarning, size: 16),
                        const SizedBox(width: 8),
                        Text("Qarz daftariga avtomatik qo'shiladi",
                            style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.7))),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
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
                  Text('Jami',
                      style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                  Text(formatMoney(_total),
                      style: TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700, color: cs.onSurface)),
                ],
              ),
            ),
            ElevatedButton.icon(
              onPressed: _items.isNotEmpty ? () => _save(context) : null,
              icon: const Icon(Icons.check),
              label: const Text('Saqlash'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _payChip(BuildContext context, String val, String label, IconData icon) {
    final cs = Theme.of(context).colorScheme;
    final sel = _payType == val;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _payType = val),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: sel ? kPrimary : cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: sel ? kPrimary : cs.outline),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: sel ? Colors.white : cs.onSurface),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: sel ? Colors.white : cs.onSurface)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Quick Add Modal ──────────────────────────────────────────────────────────
class _QuickAddModal extends StatefulWidget {
  final ValueChanged<QuickSaleItem> onAdd;
  const _QuickAddModal({required this.onAdd});

  @override
  State<_QuickAddModal> createState() => _QuickAddModalState();
}

class _QuickAddModalState extends State<_QuickAddModal> {
  TemplateItem? _selected;
  String? _variant;
  double _qty = 1;

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
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
                    Text("Mahsulot tanlang",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const Spacer(),
                    if (_selected != null)
                      ElevatedButton(
                        onPressed: () {
                          final price = _selected!.effectivePrice(_variant);
                          final sub = calcSubtotal(_selected!.unit, _qty, price);
                          widget.onAdd(QuickSaleItem(
                            name: _selected!.name,
                            variant: _variant,
                            qty: _qty,
                            unit: _selected!.unit,
                            price: price,
                            subtotal: sub,
                          ));
                          Navigator.pop(context);
                        },
                        child: const Text("Qo'shish"),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              itemCount: prov.templates.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final t = prov.templates[i];
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
                                      fontWeight: FontWeight.w600, color: cs.onSurface)),
                            ),
                            Text(
                              t.priceStatus == 'bepul'
                                  ? 'Bepul'
                                  : formatMoney(t.basePrice),
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: t.priceStatus == 'bepul' ? kSuccess : kPrimary,
                                  fontSize: 13),
                            ),
                          ],
                        ),
                        if (sel) ...[
                          if (t.variants.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: t.variants.map((v) {
                                final vSel = v == _variant;
                                return GestureDetector(
                                  onTap: () => setState(() => _variant = v),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: vSel ? kPrimary : cs.surface,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: vSel ? kPrimary : cs.outline),
                                    ),
                                    child: Text(
                                      '$v — ${formatMoney(t.variantPrices[v] ?? t.basePrice)}',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: vSel ? Colors.white : cs.onSurface),
                                    ),
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
