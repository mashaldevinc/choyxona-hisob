import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import 'order_screen.dart';

class GuestsScreen extends StatefulWidget {
  const GuestsScreen({super.key});

  @override
  State<GuestsScreen> createState() => _GuestsScreenState();
}

class _GuestsScreenState extends State<GuestsScreen> {
  void _showBandlashtirish(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _BandlashtirModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final active = prov.activeSessions;
    final freeLocs = prov.locations.where((l) => l.isActive && !l.isBusy).length;

    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Jonli Mehmonlar',
                            style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                color: cs.onSurface)),
                        Text('${active.length} faol · $freeLocs joy bo\'sh',
                            style: TextStyle(
                                fontSize: 13,
                                color: cs.onSurface.withOpacity(0.55))),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => _showBandlashtirish(context),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Bandlashtirish'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                    ),
                  ),
                ],
              ),
            ),
            // List
            Expanded(
              child: active.isEmpty
                  ? _EmptyState(onTap: () => _showBandlashtirish(context))
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: active.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) {
                        final s = active[i];
                        final total = prov.sessionBill(s.id);
                        final undel = prov
                            .getOrders(s.id)
                            .where((o) => !o.isDelivered)
                            .length;
                        return _SessionCard(
                          session: s,
                          total: total,
                          undelivered: undel,
                          onTap: s.reason != 'nosoz'
                              ? () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) =>
                                            OrderScreen(sessionId: s.id)),
                                  )
                              : null,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Session Card ─────────────────────────────────────────────────────────────
class _SessionCard extends StatelessWidget {
  final GuestSession session;
  final double total;
  final int undelivered;
  final VoidCallback? onTap;

  const _SessionCard({
    required this.session,
    required this.total,
    required this.undelivered,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isSpecial = session.reason == 'nosoz' || session.reason == 'bron';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: isSpecial ? kWarning.withOpacity(0.5) : cs.outline),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
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
                              : Icons.place,
                      size: 16,
                      color: isSpecial ? kWarning : kPrimary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(session.locationName,
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: cs.onSurface,
                                fontSize: 15)),
                        Text(
                          session.reason == 'nosoz'
                              ? 'Nosoz / Rezerv'
                              : session.reason == 'bron'
                                  ? 'Bron · ${session.guestCount} kishi'
                                  : '${session.guestCount} mehmon · ${formatTime(session.startTime)}',
                          style: TextStyle(
                              fontSize: 12,
                              color: cs.onSurface.withOpacity(0.55)),
                        ),
                      ],
                    ),
                  ),
                  if (undelivered > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: kWarning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber,
                              size: 12, color: kWarning),
                          const SizedBox(width: 4),
                          Text('$undelivered',
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: kWarning)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (session.reason != 'nosoz') ...[
              Divider(height: 1, color: cs.outline),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hozirgi hisob',
                            style: TextStyle(
                                fontSize: 11,
                                color: cs.onSurface.withOpacity(0.5))),
                        Text(formatMoney(total),
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                                color: cs.onSurface)),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.receipt_long, size: 14),
                      label: const Text('Hisob ochish'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        textStyle: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final VoidCallback onTap;
  const _EmptyState({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: kPrimary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(Icons.people, size: 36, color: kPrimary),
          ),
          const SizedBox(height: 16),
          Text('Faol mehmon yo\'q',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface)),
          const SizedBox(height: 8),
          Text('+ Bandlashtirish tugmasini bosib joy oching',
              style: TextStyle(
                  fontSize: 13,
                  color: cs.onSurface.withOpacity(0.5)),
              textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onTap,
            icon: const Icon(Icons.add),
            label: const Text('Bandlashtirish'),
          ),
        ],
      ),
    );
  }
}

// ─── Bandlashtir Modal ────────────────────────────────────────────────────────
class _BandlashtirModal extends StatefulWidget {
  const _BandlashtirModal();

  @override
  State<_BandlashtirModal> createState() => _BandlashtirModalState();
}

class _BandlashtirModalState extends State<_BandlashtirModal> {
  String _selectedLocId = '';
  String _reason = 'mehmon';
  int _guestCount = 2;

  static const _reasons = [
    ('mehmon', 'Mehmon keldi'),
    ('bron', 'Bron qilingan'),
    ('nosoz', 'Nosoz / Rezerv'),
  ];

  static const _quickNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];

  void _confirm(BuildContext context) {
    if (_selectedLocId.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Joy tanlang')));
      return;
    }
    final prov = context.read<AppProvider>();
    final loc =
        prov.locations.firstWhere((l) => l.id == _selectedLocId);
    final session = GuestSession(
      id: generateId(),
      locationId: _selectedLocId,
      locationName: loc.displayName,
      guestCount: _reason == 'nosoz' ? 0 : _guestCount,
      reason: _reason,
      startTime: DateTime.now().toIso8601String(),
    );
    prov.openSession(session);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final cs = Theme.of(context).colorScheme;
    final freeLocs = prov.locations.where((l) => l.isActive && !l.isBusy).toList();

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (_, ctrl) => SingleChildScrollView(
          controller: ctrl,
          padding: EdgeInsets.fromLTRB(
              20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.outline,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Bandlashtirish',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface)),
              const SizedBox(height: 18),

              // Location
              _sectionLabel(context, 'JOY TANLANG'),
              freeLocs.isEmpty
                  ? Text('Barcha joylar band',
                      style: TextStyle(color: cs.onSurface.withOpacity(0.5)))
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: freeLocs.map((loc) {
                        final sel = loc.id == _selectedLocId;
                        return _Chip(
                          label: loc.displayName,
                          selected: sel,
                          onTap: () =>
                              setState(() => _selectedLocId = loc.id),
                        );
                      }).toList(),
                    ),
              const SizedBox(height: 16),

              // Reason
              _sectionLabel(context, 'SABAB'),
              Wrap(
                spacing: 8,
                children: _reasons.map((r) {
                  return _Chip(
                    label: r.$2,
                    selected: r.$1 == _reason,
                    onTap: () => setState(() => _reason = r.$1),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Guest count
              if (_reason != 'nosoz') ...[
                _sectionLabel(context, 'MEHMONLAR SONI'),
                // Stepper
                Row(
                  children: [
                    _StepBtn(
                      icon: Icons.remove,
                      onTap: () =>
                          setState(() => _guestCount = (_guestCount - 1).clamp(1, 99)),
                    ),
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 12),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: kPrimary, width: 2),
                          borderRadius: BorderRadius.circular(14),
                          color: cs.background,
                        ),
                        child: Column(
                          children: [
                            Text('$_guestCount',
                                style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w700,
                                    color: cs.onSurface)),
                            Text('kishi',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: cs.onSurface.withOpacity(0.5))),
                          ],
                        ),
                      ),
                    ),
                    _StepBtn(
                      icon: Icons.add,
                      onTap: () =>
                          setState(() => _guestCount = (_guestCount + 1).clamp(1, 99)),
                      primary: true,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Quick number grid
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _quickNums.map((n) {
                    final sel = n == _guestCount;
                    return GestureDetector(
                      onTap: () => setState(() => _guestCount = n),
                      child: Container(
                        width: 48,
                        height: 44,
                        decoration: BoxDecoration(
                          color: sel ? kPrimary : cs.background,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: sel ? kPrimary : cs.outline),
                        ),
                        child: Center(
                          child: Text('$n',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                  color: sel ? Colors.white : cs.onSurface)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
              ],

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _confirm(context),
                  child: const Text('Bandlashtirish'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text,
          style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              letterSpacing: 0.7)),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? kPrimary : cs.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? kPrimary : cs.outline),
        ),
        child: Text(label,
            style: TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 13,
                color: selected ? Colors.white : cs.onSurface)),
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool primary;

  const _StepBtn({required this.icon, required this.onTap, this.primary = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: primary ? kPrimary : cs.secondary,
          borderRadius: BorderRadius.circular(14),
          border: primary ? null : Border.all(color: cs.outline),
        ),
        child: Icon(icon, size: 22,
            color: primary ? Colors.white : cs.onSurface),
      ),
    );
  }
}
