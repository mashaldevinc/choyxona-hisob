import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/formatting.dart';
import 'main_screen.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  int _step = 0;

  // Step 0
  final _nameCtrl = TextEditingController();

  // Step 1 — locations
  final _locCtrl = TextEditingController();
  final List<String> _locationNames = [];

  // Step 2 — templates
  final _tmplNameCtrl = TextEditingController();
  final _tmplPriceCtrl = TextEditingController();
  String _tmplUnit = 'dona';
  String _tmplCategory = 'Ichimliklar';
  final List<TemplateItem> _templates = [];

  // Step 3 — service
  final _svcCtrl = TextEditingController(text: '0');

  final _steps = ['Choyxona', 'Joylar', 'Mahsulotlar', 'Xizmat'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _locCtrl.dispose();
    _tmplNameCtrl.dispose();
    _tmplPriceCtrl.dispose();
    _svcCtrl.dispose();
    super.dispose();
  }

  void _addLoc() {
    final name = _locCtrl.text.trim();
    if (name.isEmpty) return;
    setState(() => _locationNames.add(name));
    _locCtrl.clear();
  }

  void _addTemplate() {
    final name = _tmplNameCtrl.text.trim();
    if (name.isEmpty) return;
    final price = double.tryParse(_tmplPriceCtrl.text.trim()) ?? 0;
    setState(() {
      _templates.add(TemplateItem(
        id: generateId(),
        name: name,
        category: _tmplCategory,
        unit: _tmplUnit,
        priceStatus: price > 0 ? 'pullik' : 'bepul',
        basePrice: price,
      ));
    });
    _tmplNameCtrl.clear();
    _tmplPriceCtrl.clear();
  }

  Future<void> _finish() async {
    final provider = context.read<AppProvider>();
    await provider.setupProfile(
      name: _nameCtrl.text.trim(),
      servicePrice: double.tryParse(_svcCtrl.text) ?? 0,
    );
    for (var name in _locationNames) {
      await provider.addLocation(LocationItem(id: generateId(), displayName: name));
    }
    for (var t in _templates) {
      await provider.addTemplate(t);
    }
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: cs.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sozlash',
                      style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface)),
                  const SizedBox(height: 16),
                  // Step indicators
                  Row(
                    children: List.generate(_steps.length, (i) {
                      final active = i == _step;
                      final done = i < _step;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: Column(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: active || done ? kPrimary : cs.outline,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: done
                                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                                      : Text('${i + 1}',
                                          style: TextStyle(
                                            color: active ? Colors.white : cs.onSurface,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 13,
                                          )),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(_steps[i],
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: active ? kPrimary : cs.onSurface.withOpacity(0.5),
                                    fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                                  )),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
            // Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildStep(),
              ),
            ),
            // Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _canNext() ? _next : null,
                  child: Text(_step == _steps.length - 1 ? 'Boshlash' : 'Keyingi →'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _canNext() {
    if (_step == 0) return _nameCtrl.text.trim().isNotEmpty;
    if (_step == 1) return _locationNames.isNotEmpty;
    return true;
  }

  void _next() {
    if (_step < _steps.length - 1) {
      setState(() => _step++);
    } else {
      _finish();
    }
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _Step0(ctrl: _nameCtrl, onChanged: (_) => setState(() {}));
      case 1:
        return _Step1(
          ctrl: _locCtrl,
          names: _locationNames,
          onAdd: _addLoc,
          onDelete: (i) => setState(() => _locationNames.removeAt(i)),
        );
      case 2:
        return _Step2(
          nameCtrl: _tmplNameCtrl,
          priceCtrl: _tmplPriceCtrl,
          unit: _tmplUnit,
          category: _tmplCategory,
          templates: _templates,
          onUnitChanged: (v) => setState(() => _tmplUnit = v),
          onCategoryChanged: (v) => setState(() => _tmplCategory = v),
          onAdd: _addTemplate,
          onDelete: (i) => setState(() => _templates.removeAt(i)),
        );
      case 3:
        return _Step3(ctrl: _svcCtrl);
      default:
        return const SizedBox();
    }
  }
}

// ─── Step 0: Name ─────────────────────────────────────────────────────────────
class _Step0 extends StatelessWidget {
  final TextEditingController ctrl;
  final ValueChanged<String> onChanged;
  const _Step0({required this.ctrl, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Choyxona nomini kiriting',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 6),
        Text("Bu nom barcha cheklarda ko'rsatiladi",
            style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
        const SizedBox(height: 20),
        TextField(
          controller: ctrl,
          onChanged: onChanged,
          decoration: const InputDecoration(hintText: 'Masalan: Bahor Choyxonasi'),
          style: const TextStyle(fontSize: 16),
          textCapitalization: TextCapitalization.words,
        ),
      ],
    );
  }
}

// ─── Step 1: Locations ────────────────────────────────────────────────────────
class _Step1 extends StatelessWidget {
  final TextEditingController ctrl;
  final List<String> names;
  final VoidCallback onAdd;
  final ValueChanged<int> onDelete;
  const _Step1({
    required this.ctrl, required this.names,
    required this.onAdd, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Joylarni qo'shing",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 6),
        Text("Stol, xona, ayvon — istalgan joy nomini kiriting",
            style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: ctrl,
                decoration: const InputDecoration(hintText: 'Masalan: 1-Stol'),
                onSubmitted: (_) => onAdd(),
              ),
            ),
            const SizedBox(width: 10),
            ElevatedButton(onPressed: onAdd, child: const Text("Qo'sh")),
          ],
        ),
        const SizedBox(height: 16),
        ...names.asMap().entries.map((e) => _chip(context, e.key, e.value)),
      ],
    );
  }

  Widget _chip(BuildContext context, int i, String name) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline),
      ),
      child: Row(
        children: [
          Icon(Icons.place, size: 16, color: kPrimary),
          const SizedBox(width: 10),
          Expanded(child: Text(name, style: TextStyle(color: cs.onSurface))),
          GestureDetector(
            onTap: () => onDelete(i),
            child: Icon(Icons.close, size: 18, color: cs.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }
}

// ─── Step 2: Templates ────────────────────────────────────────────────────────
class _Step2 extends StatelessWidget {
  final TextEditingController nameCtrl;
  final TextEditingController priceCtrl;
  final String unit;
  final String category;
  final List<TemplateItem> templates;
  final ValueChanged<String> onUnitChanged;
  final ValueChanged<String> onCategoryChanged;
  final VoidCallback onAdd;
  final ValueChanged<int> onDelete;

  const _Step2({
    required this.nameCtrl, required this.priceCtrl, required this.unit,
    required this.category, required this.templates, required this.onUnitChanged,
    required this.onCategoryChanged, required this.onAdd, required this.onDelete,
  });

  static const _units = ['dona', 'kg', 'gr'];
  static const _cats = ['Ichimliklar', 'Taomlar', 'Shirinliklar', 'Qo\'shimcha', 'Umumiy'];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Mahsulotlar (ixtiyoriy)",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 6),
        Text("Menyu mahsulotlarini oldindan kiriting",
            style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
        const SizedBox(height: 16),
        TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: 'Mahsulot nomi')),
        const SizedBox(height: 10),
        TextField(controller: priceCtrl, keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: "Narx (so'm, 0 = bepul)")),
        const SizedBox(height: 10),
        // Unit picker
        _label(context, 'Birlik'),
        Wrap(
          spacing: 8,
          children: _units.map((u) => _chip2(context, u, unit, () => onUnitChanged(u))).toList(),
        ),
        const SizedBox(height: 10),
        _label(context, 'Kategoriya'),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: _cats.map((c) => _chip2(context, c, category, () => onCategoryChanged(c))).toList(),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.add),
            label: const Text("Mahsulot qo'shish"),
            style: OutlinedButton.styleFrom(
              foregroundColor: kPrimary,
              side: const BorderSide(color: kPrimary),
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 16),
        ...templates.asMap().entries.map((e) {
          final t = e.value;
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
                      Text(t.name, style: TextStyle(fontWeight: FontWeight.w600, color: cs.onSurface)),
                      Text('${t.category} · ${t.unit} · ${t.basePrice > 0 ? "${t.basePrice.toInt()} so\'m" : "Bepul"}',
                          style: TextStyle(fontSize: 11, color: cs.onSurface.withOpacity(0.5))),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => onDelete(e.key),
                  child: Icon(Icons.close, size: 18, color: cs.onSurface.withOpacity(0.4)),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _label(BuildContext context, String text) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600,
              color: cs.onSurface.withOpacity(0.5), letterSpacing: 0.7)),
    );
  }

  Widget _chip2(BuildContext context, String label, String selected, VoidCallback onTap) {
    final cs = Theme.of(context).colorScheme;
    final active = label == selected;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? kPrimary : cs.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? kPrimary : cs.outline),
        ),
        child: Text(label,
            style: TextStyle(
              color: active ? Colors.white : cs.onSurface,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            )),
      ),
    );
  }
}

// ─── Step 3: Service ──────────────────────────────────────────────────────────
class _Step3 extends StatelessWidget {
  final TextEditingController ctrl;
  const _Step3({required this.ctrl});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Xizmat narxi",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: cs.onSurface)),
        const SizedBox(height: 6),
        Text("Har bir mehmon uchun qo'shimcha xizmat narxi (0 = bepul)",
            style: TextStyle(fontSize: 13, color: cs.onSurface.withOpacity(0.55))),
        const SizedBox(height: 20),
        TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: "Masalan: 5000"),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: kPrimary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: kPrimary, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "Xizmat narxi hisobda avtomatik qo'shiladi:\nmehmonlar soni × xizmat narxi",
                  style: TextStyle(fontSize: 12, color: cs.onSurface.withOpacity(0.7)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
