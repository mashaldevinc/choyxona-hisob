import 'dart:convert';

// ─── AppProfile ───────────────────────────────────────────────────────────────
class AppProfile {
  String name;
  double servicePrice;
  bool isDarkMode;

  AppProfile({
    required this.name,
    this.servicePrice = 0,
    this.isDarkMode = false,
  });

  factory AppProfile.fromJson(Map<String, dynamic> j) => AppProfile(
        name: j['name'] ?? '',
        servicePrice: (j['servicePrice'] ?? 0).toDouble(),
        isDarkMode: j['isDarkMode'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'servicePrice': servicePrice,
        'isDarkMode': isDarkMode,
      };
}

// ─── LocationItem ─────────────────────────────────────────────────────────────
class LocationItem {
  String id;
  String displayName;
  bool isActive;
  bool isBusy;

  LocationItem({
    required this.id,
    required this.displayName,
    this.isActive = true,
    this.isBusy = false,
  });

  factory LocationItem.fromJson(Map<String, dynamic> j) => LocationItem(
        id: j['id'],
        displayName: j['displayName'],
        isActive: j['isActive'] ?? true,
        isBusy: j['isBusy'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'displayName': displayName,
        'isActive': isActive,
        'isBusy': isBusy,
      };
}

// ─── TemplateItem ─────────────────────────────────────────────────────────────
class TemplateItem {
  String id;
  String name;
  String category;
  String unit; // dona | kg | gr
  String priceStatus; // pullik | bepul
  double basePrice;
  List<String> variants;
  Map<String, double> variantPrices;

  TemplateItem({
    required this.id,
    required this.name,
    this.category = 'Umumiy',
    this.unit = 'dona',
    this.priceStatus = 'pullik',
    this.basePrice = 0,
    List<String>? variants,
    Map<String, double>? variantPrices,
  })  : variants = variants ?? [],
        variantPrices = variantPrices ?? {};

  factory TemplateItem.fromJson(Map<String, dynamic> j) => TemplateItem(
        id: j['id'],
        name: j['name'],
        category: j['category'] ?? 'Umumiy',
        unit: j['unit'] ?? 'dona',
        priceStatus: j['priceStatus'] ?? 'pullik',
        basePrice: (j['basePrice'] ?? 0).toDouble(),
        variants: List<String>.from(j['variants'] ?? []),
        variantPrices: (j['variantPrices'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, (v as num).toDouble())),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'category': category,
        'unit': unit,
        'priceStatus': priceStatus,
        'basePrice': basePrice,
        'variants': variants,
        'variantPrices': variantPrices,
      };

  double effectivePrice(String? variant) {
    if (variant != null && variantPrices.containsKey(variant)) {
      return variantPrices[variant]!;
    }
    return basePrice;
  }
}

// ─── GuestSession ─────────────────────────────────────────────────────────────
class GuestSession {
  String id;
  String locationId;
  String locationName;
  int guestCount;
  String reason; // mehmon | bron | nosoz
  String status; // active | closed
  String startTime; // ISO8601

  GuestSession({
    required this.id,
    required this.locationId,
    required this.locationName,
    this.guestCount = 0,
    this.reason = 'mehmon',
    this.status = 'active',
    required this.startTime,
  });

  factory GuestSession.fromJson(Map<String, dynamic> j) => GuestSession(
        id: j['id'],
        locationId: j['locationId'],
        locationName: j['locationName'],
        guestCount: j['guestCount'] ?? 0,
        reason: j['reason'] ?? 'mehmon',
        status: j['status'] ?? 'active',
        startTime: j['startTime'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'locationId': locationId,
        'locationName': locationName,
        'guestCount': guestCount,
        'reason': reason,
        'status': status,
        'startTime': startTime,
      };
}

// ─── OrderItem ────────────────────────────────────────────────────────────────
class OrderItem {
  String id;
  String name;
  String? variant;
  String unit;
  double qtyOrWeight;
  double price;
  double subtotal;
  bool isDelivered;

  OrderItem({
    required this.id,
    required this.name,
    this.variant,
    this.unit = 'dona',
    this.qtyOrWeight = 1,
    this.price = 0,
    this.subtotal = 0,
    this.isDelivered = false,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j['id'],
        name: j['name'],
        variant: j['variant'],
        unit: j['unit'] ?? 'dona',
        qtyOrWeight: (j['qtyOrWeight'] ?? 1).toDouble(),
        price: (j['price'] ?? 0).toDouble(),
        subtotal: (j['subtotal'] ?? 0).toDouble(),
        isDelivered: j['isDelivered'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'variant': variant,
        'unit': unit,
        'qtyOrWeight': qtyOrWeight,
        'price': price,
        'subtotal': subtotal,
        'isDelivered': isDelivered,
      };
}

// ─── Installment ──────────────────────────────────────────────────────────────
class Installment {
  String id;
  String date;
  double amount;
  String? note;
  double balanceAfter;

  Installment({
    required this.id,
    required this.date,
    required this.amount,
    this.note,
    required this.balanceAfter,
  });

  factory Installment.fromJson(Map<String, dynamic> j) => Installment(
        id: j['id'],
        date: j['date'],
        amount: (j['amount'] ?? 0).toDouble(),
        note: j['note'],
        balanceAfter: (j['balanceAfter'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'amount': amount,
        'note': note,
        'balanceAfter': balanceAfter,
      };
}

// ─── Debt ─────────────────────────────────────────────────────────────────────
class Debt {
  String id;
  String debtorName;
  double totalDebt;
  double paidAmount;
  double remainingAmount;
  String status; // toliq | qisman | tolanmagan
  String createdAt;
  String? note;
  List<Installment> installments;

  Debt({
    required this.id,
    required this.debtorName,
    required this.totalDebt,
    this.paidAmount = 0,
    required this.remainingAmount,
    this.status = 'tolanmagan',
    required this.createdAt,
    this.note,
    List<Installment>? installments,
  }) : installments = installments ?? [];

  factory Debt.fromJson(Map<String, dynamic> j) => Debt(
        id: j['id'],
        debtorName: j['debtorName'],
        totalDebt: (j['totalDebt'] ?? 0).toDouble(),
        paidAmount: (j['paidAmount'] ?? 0).toDouble(),
        remainingAmount: (j['remainingAmount'] ?? 0).toDouble(),
        status: j['status'] ?? 'tolanmagan',
        createdAt: j['createdAt'],
        note: j['note'],
        installments: (j['installments'] as List<dynamic>? ?? [])
            .map((e) => Installment.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'debtorName': debtorName,
        'totalDebt': totalDebt,
        'paidAmount': paidAmount,
        'remainingAmount': remainingAmount,
        'status': status,
        'createdAt': createdAt,
        'note': note,
        'installments': installments.map((e) => e.toJson()).toList(),
      };
}

// ─── QuickSaleItem ────────────────────────────────────────────────────────────
class QuickSaleItem {
  String name;
  String? variant;
  double qty;
  String unit;
  double price;
  double subtotal;

  QuickSaleItem({
    required this.name,
    this.variant,
    required this.qty,
    required this.unit,
    required this.price,
    required this.subtotal,
  });

  factory QuickSaleItem.fromJson(Map<String, dynamic> j) => QuickSaleItem(
        name: j['name'],
        variant: j['variant'],
        qty: (j['qty'] ?? 1).toDouble(),
        unit: j['unit'] ?? 'dona',
        price: (j['price'] ?? 0).toDouble(),
        subtotal: (j['subtotal'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'variant': variant,
        'qty': qty,
        'unit': unit,
        'price': price,
        'subtotal': subtotal,
      };
}

// ─── QuickSale ────────────────────────────────────────────────────────────────
class QuickSale {
  String id;
  String? buyerName;
  List<QuickSaleItem> items;
  double total;
  String paymentType; // naqd | qarz
  String createdAt;
  String? debtId;

  QuickSale({
    required this.id,
    this.buyerName,
    required this.items,
    required this.total,
    this.paymentType = 'naqd',
    required this.createdAt,
    this.debtId,
  });

  factory QuickSale.fromJson(Map<String, dynamic> j) => QuickSale(
        id: j['id'],
        buyerName: j['buyerName'],
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => QuickSaleItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: (j['total'] ?? 0).toDouble(),
        paymentType: j['paymentType'] ?? 'naqd',
        createdAt: j['createdAt'],
        debtId: j['debtId'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'buyerName': buyerName,
        'items': items.map((e) => e.toJson()).toList(),
        'total': total,
        'paymentType': paymentType,
        'createdAt': createdAt,
        'debtId': debtId,
      };
}
