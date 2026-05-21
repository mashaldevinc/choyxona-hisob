import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';

class DebtDetailScreen extends StatelessWidget {
  final String debtId;
  const DebtDetailScreen({super.key, required this.debtId});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final debt = prov.getDebt(debtId);

    if (debt == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Qarz')),
        body: const Center(child: Text('Topilmadi')),
      );
    }

    final pct = debt.totalDebt > 0 ? debt.paidAmount / debt.totalDebt : 0.0;
    final statusColor = debt.status == 'toliq'
        ? kSuccess
        : debt.status == 'qisman'
            ? kWarning
            : kDestructive;
    final statusLabel = debt.status == 'toliq'
        ? "To'langan"
        : debt.status == 'qisman'
            ? "Qisman to'langan"
            : "To'lanmagan";

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(title: Text(debt.debtorName)),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
              children: [
                // Summary card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: cs.outline),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(
                              color: kPrimary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(22),
                            ),
                            child: const Icon(Icons.person, color: kPrimary, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(debt.debtorName,
                                    style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 17,
                                        color: cs.onSurface)),
                                Text(formatDate(debt.createdAt),
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: cs.onSurface.withOpacity(0.5))),
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
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: statusColor)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(5),
                        child: LinearProgressIndicator(
                          value: pct.toDouble(),
                          backgroundColor: cs.outline,
                          valueColor: AlwaysStoppedAnimation(statusColor),
                          minHeight: 10,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text('${(pct * 100).toStringAsFixed(0)}% to\'langan',
                            style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _amtCol(context, 'Jami qarz', debt.totalDebt, cs.onSurface),
                          _amtCol(context, "To'langan", debt.paidAmount, kSuccess),
                          _amtCol(context, 'Qoldiq', debt.remainingAmount, kDestructive),
                        ],
                      ),
                      if (debt.note != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: cs.secondary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.notes, size: 14, color: cs.onSurface.withOpacity(0.5)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(debt.note!,
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: cs.onSurface.withOpacity(0.7))),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text("To'lov tarixi",
                    style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16, color: cs.onSurface)),
                const SizedBox(height: 10),
                if (debt.installments.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: cs.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: cs.outline),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.inbox, size: 28, color: cs.onSurface.withOpacity(0.3)),
                        const SizedBox(height: 8),
                        Text("Hali to'lov qilinmagan",
                            style: TextStyle(color: cs.onSurface.withOpacity(0.5))),
                      ],
                    ),
                  )
                else
                  ...debt.installments.asMap().entries.map((e) {
                    final inst = e.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: cs.outline),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(
                              color: kSuccess.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text('${e.key + 1}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700, color: kSuccess)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('+ ${formatMoney(inst.amount)}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700, color: kSuccess)),
                                Text(formatDateTime(inst.date),
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: cs.onSurface.withOpacity(0.5))),
                                if (inst.note != null)
                                  Text(inst.note!,
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: cs.onSurface.withOpacity(0.5))),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('Qoldiq',
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: cs.onSurface.withOpacity(0.45))),
                              Text(formatMoney(inst.balanceAfter),
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                      color: cs.onSurface)),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        ],
      ),
      bottomSheet: debt.status != 'toliq'
          ? Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              decoration: BoxDecoration(
                color: cs.surface,
                border: Border(top: BorderSide(color: cs.outline)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Qoldiq qarz:",
                          style: TextStyle(
                              fontWeight: FontWeight.w500, color: cs.onSurface.withOpacity(0.6))),
                      Text(formatMoney(debt.remainingAmount),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 18, color: kDestructive)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _showPaymentModal(context, debt),
                      icon: const Icon(Icons.add),
                      label: const Text("To'lov qo'shish"),
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  Widget _amtCol(BuildContext context, String label, double val, Color color) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(label,
            style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
        const SizedBox(height: 2),
        Text(formatMoney(val),
            style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 14)),
      ],
    );
  }

  void _showPaymentModal(BuildContext context, Debt debt) {
    final amtCtrl = TextEditingController();
    final noteCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setModal) {
          final cs = Theme.of(ctx2).colorScheme;

          void applyPct(double pct) {
            final v = (debt.remainingAmount * pct).round();
            amtCtrl.text = v.toString();
            setModal(() {});
          }

          final amtVal = double.tryParse(amtCtrl.text) ?? 0;
          final isValid = amtVal > 0 && amtVal <= debt.remainingAmount + 0.5;

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx2).viewInsets.bottom),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36, height: 4,
                      decoration: BoxDecoration(
                        color: cs.outline, borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text("To'lov qo'shish",
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
                  const SizedBox(height: 8),
                  // Remaining info
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: kDestructive.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: kDestructive, size: 16),
                        const SizedBox(width: 8),
                        Text("Qoldiq qarz: ",
                            style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.6))),
                        Text(formatMoney(debt.remainingAmount),
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, color: kDestructive, fontSize: 14)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Quick percent buttons
                  Text("TEZKOR MIQDOR",
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                          color: cs.onSurface.withOpacity(0.5), letterSpacing: 0.7)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _pctBtn(ctx2, "25%", () => applyPct(0.25), false),
                      const SizedBox(width: 8),
                      _pctBtn(ctx2, "50%", () => applyPct(0.5), false),
                      const SizedBox(width: 8),
                      _pctBtn(ctx2, "75%", () => applyPct(0.75), false),
                      const SizedBox(width: 8),
                      _pctBtn(ctx2, "To'liq", () => applyPct(1.0), true),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Amount input
                  Text("SUMMA (SO'M)",
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                          color: cs.onSurface.withOpacity(0.5), letterSpacing: 0.7)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: amtCtrl,
                    onChanged: (_) => setModal(() {}),
                    keyboardType: TextInputType.number,
                    autofocus: true,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                    decoration: InputDecoration(
                      hintText: '0',
                      suffixText: "so'm",
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: isValid ? kPrimary : cs.outline, width: isValid ? 2 : 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: isValid ? kSuccess : kPrimary, width: 2),
                      ),
                    ),
                  ),
                  if (isValid)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        "To'lovdan keyin qoladi: ${formatMoney((debt.remainingAmount - amtVal).clamp(0, double.infinity))}",
                        style: const TextStyle(fontSize: 12, color: kSuccess),
                      ),
                    ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: noteCtrl,
                    decoration: const InputDecoration(hintText: 'Izoh (ixtiyoriy)'),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: isValid
                          ? () {
                              final amt = amtVal.clamp(0, debt.remainingAmount).toDouble();
                              final inst = Installment(
                                id: generateId(),
                                date: DateTime.now().toIso8601String(),
                                amount: amt,
                                note: noteCtrl.text.trim().isEmpty ? null : noteCtrl.text.trim(),
                                balanceAfter: (debt.remainingAmount - amt).clamp(0, double.infinity),
                              );
                              context.read<AppProvider>().addInstallment(debtId, inst);
                              Navigator.pop(ctx2);
                            }
                          : null,
                      icon: const Icon(Icons.check),
                      label: const Text("To'lovni tasdiqlash"),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _pctBtn(BuildContext context, String label, VoidCallback onTap, bool primary) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: primary ? kPrimary : cs.background,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: primary ? kPrimary : cs.outline),
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: primary ? Colors.white : cs.onSurface,
                  fontSize: 13)),
        ),
      ),
    );
  }
}
