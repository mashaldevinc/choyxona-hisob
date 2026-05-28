import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/models.dart';
import '../utils/formatting.dart';

const _kBox = 'choyxona_data';

class AppProvider extends ChangeNotifier {
  late Box<String> _box;

  AppProfile? profile;
  List<LocationItem> locations = [];
  List<TemplateItem> templates = [];
  List<GuestSession> sessions = [];
  Map<String, List<OrderItem>> orders = {};
  List<Debt> debts = [];
  List<QuickSale> quickSales = [];

  bool get isSetupDone => profile != null && profile!.name.isNotEmpty;
  bool get isDarkMode => profile?.isDarkMode ?? false;

  // ─── Init ──────────────────────────────────────────────────────────────────
  Future<void> init() async {
    _box = await Hive.openBox<String>(_kBox);
    _load();
  }

  void _load() {
    final pJson = _box.get('profile');
    if (pJson != null) {
      profile = AppProfile.fromJson(jsonDecode(pJson));
    }
    final lJson = _box.get('locations');
    if (lJson != null) {
      locations = (jsonDecode(lJson) as List)
          .map((e) => LocationItem.fromJson(e))
          .toList();
    }
    final tJson = _box.get('templates');
    if (tJson != null) {
      templates = (jsonDecode(tJson) as List)
          .map((e) => TemplateItem.fromJson(e))
          .toList();
    }
    final sJson = _box.get('sessions');
    if (sJson != null) {
      sessions = (jsonDecode(sJson) as List)
          .map((e) => GuestSession.fromJson(e))
          .toList();
    }
    final oJson = _box.get('orders');
    if (oJson != null) {
      final raw = jsonDecode(oJson) as Map<String, dynamic>;
      orders = raw.map((k, v) => MapEntry(
            k,
            (v as List).map((e) => OrderItem.fromJson(e)).toList(),
          ));
    }
    final dJson = _box.get('debts');
    if (dJson != null) {
      debts =
          (jsonDecode(dJson) as List).map((e) => Debt.fromJson(e)).toList();
    }
    final qJson = _box.get('quickSales');
    if (qJson != null) {
      quickSales = (jsonDecode(qJson) as List)
          .map((e) => QuickSale.fromJson(e))
          .toList();
    }
  }

  Future<void> _saveProfile() async {
    if (profile != null) {
      await _box.put('profile', jsonEncode(profile!.toJson()));
    }
  }

  Future<void> _saveLocations() async {
    await _box.put('locations', jsonEncode(locations.map((e) => e.toJson()).toList()));
  }

  Future<void> _saveTemplates() async {
    await _box.put('templates', jsonEncode(templates.map((e) => e.toJson()).toList()));
  }

  Future<void> _saveSessions() async {
    await _box.put('sessions', jsonEncode(sessions.map((e) => e.toJson()).toList()));
  }

  Future<void> _saveOrders() async {
    final raw = orders.map(
        (k, v) => MapEntry(k, v.map((e) => e.toJson()).toList()));
    await _box.put('orders', jsonEncode(raw));
  }

  Future<void> _saveDebts() async {
    await _box.put('debts', jsonEncode(debts.map((e) => e.toJson()).toList()));
  }

  Future<void> _saveQuickSales() async {
    await _box.put('quickSales', jsonEncode(quickSales.map((e) => e.toJson()).toList()));
  }

  // ─── Profile ───────────────────────────────────────────────────────────────
  Future<void> setupProfile({
    required String name,
    required double servicePrice,
  }) async {
    profile = AppProfile(name: name, servicePrice: servicePrice);
    await _saveProfile();
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    if (profile == null) return;
    profile!.isDarkMode = value;
    await _saveProfile();
    notifyListeners();
  }

  Future<void> updateServicePrice(double price) async {
    if (profile == null) return;
    profile!.servicePrice = price;
    await _saveProfile();
    notifyListeners();
  }

  // ─── Locations ─────────────────────────────────────────────────────────────
  Future<void> addLocation(LocationItem loc) async {
    locations.add(loc);
    await _saveLocations();
    notifyListeners();
  }

  Future<void> setLocationBusy(String id, bool busy) async {
    final idx = locations.indexWhere((l) => l.id == id);
    if (idx >= 0) {
      locations[idx].isBusy = busy;
      await _saveLocations();
      notifyListeners();
    }
  }

  Future<void> deleteLocation(String id) async {
    locations.removeWhere((l) => l.id == id);
    await _saveLocations();
    notifyListeners();
  }

  // ─── Templates ─────────────────────────────────────────────────────────────
  Future<void> addTemplate(TemplateItem t) async {
    templates.add(t);
    await _saveTemplates();
    notifyListeners();
  }

  Future<void> updateTemplate(TemplateItem t) async {
    final idx = templates.indexWhere((x) => x.id == t.id);
    if (idx >= 0) templates[idx] = t;
    await _saveTemplates();
    notifyListeners();
  }

  Future<void> deleteTemplate(String id) async {
    templates.removeWhere((t) => t.id == id);
    await _saveTemplates();
    notifyListeners();
  }

  List<String> get categories {
    final cats = templates.map((t) => t.category).toSet().toList();
    cats.sort();
    return cats;
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────
  Future<void> openSession(GuestSession session) async {
    sessions.add(session);
    orders[session.id] = [];
    await setLocationBusy(session.locationId, true);
    await _saveSessions();
    await _saveOrders();
    notifyListeners();
  }

  Future<void> closeSession(String sessionId, {required String paymentType}) async {
    final idx = sessions.indexWhere((s) => s.id == sessionId);
    if (idx < 0) return;
    final session = sessions[idx];
    sessions[idx] = GuestSession(
      id: session.id,
      locationId: session.locationId,
      locationName: session.locationName,
      guestCount: session.guestCount,
      reason: session.reason,
      status: 'closed',
      startTime: session.startTime,
    );
    // Auto-create a cleaning session — location stays busy until staff marks it clean
    if (session.reason != 'tozalash') {
      final cleanSession = GuestSession(
        id: generateId(),
        locationId: session.locationId,
        locationName: session.locationName,
        guestCount: 0,
        reason: 'tozalash',
        status: 'active',
        startTime: DateTime.now().toIso8601String(),
      );
      sessions.add(cleanSession);
      orders[cleanSession.id] = [];
      await _saveOrders();
    }
    await _saveSessions();
    notifyListeners();
  }

  /// Staff pressed "Sozlandi" — cleaning done, free the location
  Future<void> markCleaned(String cleaningSessionId) async {
    final idx = sessions.indexWhere((s) => s.id == cleaningSessionId);
    if (idx < 0) return;
    final session = sessions[idx];
    sessions[idx] = GuestSession(
      id: session.id,
      locationId: session.locationId,
      locationName: session.locationName,
      guestCount: 0,
      reason: 'tozalash',
      status: 'closed',
      startTime: session.startTime,
    );
    await setLocationBusy(session.locationId, false);
    await _saveSessions();
    notifyListeners();
  }

  List<GuestSession> get activeSessions =>
      sessions.where((s) => s.status == 'active').toList();

  List<GuestSession> get cleaningSessions =>
      sessions.where((s) => s.status == 'active' && s.reason == 'tozalash').toList();

  List<GuestSession> get guestSessions =>
      sessions.where((s) => s.status == 'active' && s.reason != 'tozalash').toList();

  GuestSession? getSession(String id) {
    try {
      return sessions.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  // ─── Orders ────────────────────────────────────────────────────────────────
  Future<void> addOrderItem(String sessionId, OrderItem item) async {
    orders.putIfAbsent(sessionId, () => []);
    orders[sessionId]!.add(item);
    await _saveOrders();
    notifyListeners();
  }

  Future<void> removeOrderItem(String sessionId, String itemId) async {
    orders[sessionId]?.removeWhere((o) => o.id == itemId);
    await _saveOrders();
    notifyListeners();
  }

  Future<void> markDelivered(String sessionId, String itemId) async {
    final list = orders[sessionId] ?? [];
    final idx = list.indexWhere((o) => o.id == itemId);
    if (idx >= 0) {
      list[idx].isDelivered = true;
      await _saveOrders();
      notifyListeners();
    }
  }

  Future<void> markAllDelivered(String sessionId) async {
    final list = orders[sessionId] ?? [];
    for (final item in list) {
      item.isDelivered = true;
    }
    await _saveOrders();
    notifyListeners();
  }

  List<OrderItem> getOrders(String sessionId) =>
      orders[sessionId] ?? [];

  double sessionTotal(String sessionId) =>
      getOrders(sessionId).fold(0.0, (s, o) => s + o.subtotal);

  double sessionBill(String sessionId) {
    final session = getSession(sessionId);
    final svcPrice = profile?.servicePrice ?? 0;
    return sessionTotal(sessionId) + (session?.guestCount ?? 0) * svcPrice;
  }

  // ─── Debts ─────────────────────────────────────────────────────────────────
  Future<void> addDebt(Debt debt) async {
    debts.add(debt);
    await _saveDebts();
    notifyListeners();
  }

  Future<void> addInstallment(String debtId, Installment inst) async {
    final idx = debts.indexWhere((d) => d.id == debtId);
    if (idx < 0) return;
    debts[idx].installments.add(inst);
    debts[idx].paidAmount += inst.amount;
    debts[idx].remainingAmount -= inst.amount;
    if (debts[idx].remainingAmount <= 0) {
      debts[idx].remainingAmount = 0;
      debts[idx].status = 'toliq';
    } else {
      debts[idx].status = 'qisman';
    }
    await _saveDebts();
    notifyListeners();
  }

  Debt? getDebt(String id) {
    try {
      return debts.firstWhere((d) => d.id == id);
    } catch (_) {
      return null;
    }
  }

  double get totalDebtRemaining =>
      debts.where((d) => d.status != 'toliq').fold(0.0, (s, d) => s + d.remainingAmount);

  // ─── Quick Sales ───────────────────────────────────────────────────────────
  Future<void> addQuickSale(QuickSale sale) async {
    quickSales.add(sale);
    if (sale.paymentType == 'qarz') {
      final debtId = generateId();
      final debt = Debt(
        id: debtId,
        debtorName: sale.buyerName ?? 'Noma\'lum xaridor',
        totalDebt: sale.total,
        remainingAmount: sale.total,
        createdAt: sale.createdAt,
        note: 'Tezkor sotuv',
      );
      debts.add(debt);
      await _saveDebts();
    }
    await _saveQuickSales();
    notifyListeners();
  }

  // ─── Checkout (close session + create receipt) ─────────────────────────────
  Future<void> checkoutSession({
    required String sessionId,
    required String paymentType,
    String? buyerName,
  }) async {
    if (paymentType == 'qarz') {
      final total = sessionBill(sessionId);
      final session = getSession(sessionId);
      final debt = Debt(
        id: generateId(),
        debtorName: buyerName ?? session?.locationName ?? 'Mehmon',
        totalDebt: total,
        remainingAmount: total,
        createdAt: DateTime.now().toIso8601String(),
        note: 'Stol: ${session?.locationName ?? ''}',
      );
      await addDebt(debt);
    }
    await closeSession(sessionId, paymentType: paymentType);
  }
}
