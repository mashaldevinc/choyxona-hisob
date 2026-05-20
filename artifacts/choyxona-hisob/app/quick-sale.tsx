import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { QuickSaleItem, QuickSalePayment, TemplateItem } from '@/types';
import { formatMoney, generateId } from '@/utils/formatting';
import { calcOrderItemSubtotal } from '@/utils/calculations';

function getStep(unit: string) {
  if (unit === 'kg') return 0.1;
  if (unit === 'gr') return 50;
  return 1;
}
function fmtQty(qty: number, unit: string) {
  return unit === 'kg' ? qty.toFixed(1) : String(Math.round(qty));
}
function getVariantPrice(t: TemplateItem, variant: string): number {
  if (t.priceStatus === 'bonus') return 0;
  const vp = (t.variantPrices ?? {})[variant];
  return vp != null ? vp : t.basePrice;
}

function MiniStepper({
  value,
  unit,
  onChange,
  colors,
}: {
  value: number;
  unit: string;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const step = getStep(unit);
  return (
    <View style={ss.stepRow}>
      <TouchableOpacity
        style={[ss.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        onPress={() => { onChange(Math.max(step, parseFloat((value - step).toFixed(3)))); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="minus" size={14} color={colors.foreground} />
      </TouchableOpacity>
      <View style={[ss.stepVal, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[ss.stepValText, { color: colors.foreground }]}>{fmtQty(value, unit)}</Text>
        <Text style={[ss.stepUnit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
      <TouchableOpacity
        style={[ss.stepBtn, { backgroundColor: colors.primary }]}
        onPress={() => { onChange(parseFloat((value + step).toFixed(3))); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="plus" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const ss = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepVal: { minWidth: 64, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  stepValText: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  stepUnit: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },
});

export default function QuickSaleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { templates, addQuickSale, addDebt } = useApp();

  const [buyerName, setBuyerName] = useState('');
  const [items, setItems] = useState<QuickSaleItem[]>([]);
  const [paymentType, setPaymentType] = useState<QuickSalePayment>('naqd');

  const [showModal, setShowModal] = useState(false);
  const [selTemplate, setSelTemplate] = useState<TemplateItem | null>(null);
  const [selVariant, setSelVariant] = useState('');
  const [modalQty, setModalQty] = useState(1);
  const [search, setSearch] = useState('');

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.isActive && t.name.toLowerCase().includes(search.toLowerCase())),
    [templates, search]
  );

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  function openModal() {
    setSelTemplate(null);
    setSelVariant('');
    setModalQty(1);
    setSearch('');
    setShowModal(true);
  }

  function selectTpl(t: TemplateItem) {
    setSelTemplate(t);
    setSelVariant(t.variants[0] ?? '');
    setModalQty(getStep(t.unit));
  }

  function addItem() {
    if (!selTemplate) return;
    const price = getVariantPrice(selTemplate, selVariant);
    const subtotal = calcOrderItemSubtotal(selTemplate.unit, modalQty, price);
    const existing = items.find(
      (i) => i.templateId === selTemplate.id && (i.variant ?? '') === selVariant
    );
    if (existing) {
      const newQty = parseFloat((existing.qtyOrWeight + modalQty).toFixed(3));
      setItems((prev) =>
        prev.map((i) =>
          i.id === existing.id
            ? { ...i, qtyOrWeight: newQty, subtotal: calcOrderItemSubtotal(i.unit, newQty, i.unitPrice) }
            : i
        )
      );
    } else {
      const newItem: QuickSaleItem = {
        id: generateId(),
        templateId: selTemplate.id,
        name: selTemplate.name,
        variant: selVariant || undefined,
        unit: selTemplate.unit,
        qtyOrWeight: modalQty,
        unitPrice: price,
        subtotal,
      };
      setItems((prev) => [...prev, newItem]);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItemQty(id: string, newQty: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, qtyOrWeight: newQty, subtotal: calcOrderItemSubtotal(i.unit, newQty, i.unitPrice) }
          : i
      )
    );
  }

  function confirm() {
    if (items.length === 0) { Alert.alert('Xato', "Kamida bitta mahsulot qo'shing"); return; }
    const name = buyerName.trim() || 'Noma\'lum mijoz';
    const saleId = generateId();
    const now = new Date().toISOString();

    let debtId: string | undefined;
    if (paymentType === 'qarz') {
      debtId = generateId();
      addDebt({
        id: debtId,
        debtorName: name,
        totalDebt: total,
        paidAmount: 0,
        remainingAmount: total,
        status: 'tolanmagan',
        installments: [],
        note: `Tezkor sotuv (#${saleId.slice(-6)})`,
        createdAt: now,
      });
    }

    addQuickSale({
      id: saleId,
      buyerName: name,
      items,
      paymentType,
      total,
      timestamp: now,
      debtId,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Sotuv saqlandi",
      `${name} · ${formatMoney(total)}${paymentType === 'qarz' ? '\nQarz daftariga qo\'shildi' : ''}`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>Sotuv qo'shish</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 160 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Buyer name */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Xaridor ismi</Text>
          <TextInput
            style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Ism kiriting (ixtiyoriy)"
            placeholderTextColor={colors.mutedForeground}
            value={buyerName}
            onChangeText={setBuyerName}
          />
        </View>

        {/* Payment type */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>To'lov turi</Text>
          <View style={styles.payRow}>
            {(['naqd', 'qarz'] as const).map((pt) => (
              <TouchableOpacity
                key={pt}
                style={[
                  styles.payChip,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  paymentType === pt && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setPaymentType(pt)}
              >
                <Feather
                  name={pt === 'naqd' ? 'dollar-sign' : 'book-open'}
                  size={15}
                  color={paymentType === pt ? '#fff' : colors.foreground}
                />
                <Text style={[styles.payChipText, { color: paymentType === pt ? '#fff' : colors.foreground }]}>
                  {pt === 'naqd' ? 'Naqd pul' : 'Qarzga'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {paymentType === 'qarz' && (
            <View style={[styles.qarzNote, { backgroundColor: colors.warning + '18' }]}>
              <Feather name="info" size={13} color={colors.warning} />
              <Text style={[styles.qarzNoteText, { color: colors.warning }]}>
                Qarz daftariga avtomatik qo'shiladi
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Mahsulotlar ({items.length})
            </Text>
            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: colors.primary }]}
              onPress={openModal}
            >
              <Feather name="plus" size={15} color="#fff" />
              <Text style={styles.addItemBtnText}>Qo'shish</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Feather name="shopping-cart" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyItemsText, { color: colors.mutedForeground }]}>Mahsulot qo'shing</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {items.map((item) => (
                <View key={item.id} style={[styles.itemCard, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>
                      {item.name}{item.variant ? ` · ${item.variant}` : ''}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.mutedForeground }]}>
                      {formatMoney(item.unitPrice)} / {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <MiniStepper
                      value={item.qtyOrWeight}
                      unit={item.unit}
                      onChange={(q) => updateItemQty(item.id, q)}
                      colors={colors}
                    />
                    <Text style={[styles.itemSubtotal, { color: colors.foreground }]}>
                      {formatMoney(item.subtotal)}
                    </Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Feather name="trash-2" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerTop}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Jami:</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatMoney(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }, items.length === 0 && { opacity: 0.5 }]}
          onPress={confirm}
          disabled={items.length === 0}
        >
          <Feather name={paymentType === 'naqd' ? 'check-circle' : 'book-open'} size={18} color="#fff" />
          <Text style={styles.confirmText}>
            {paymentType === 'naqd' ? 'Sotuvni saqlash' : "Qarzga saqlash"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product picker modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
          <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Mahsulot tanlang</Text>

            <TextInput
              style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Qidirish..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />

            {!selTemplate ? (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {activeTemplates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tplRow, { borderBottomColor: colors.border }]}
                    onPress={() => selectTpl(t)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tplName, { color: colors.foreground }]}>{t.name}</Text>
                      <Text style={[styles.tplSub, { color: colors.mutedForeground }]}>
                        {t.priceStatus === 'bonus' ? 'Bepul' : t.variants.length > 0
                          ? t.variants.map((v) => {
                              const vp = (t.variantPrices ?? {})[v];
                              return vp != null ? `${v}: ${vp.toLocaleString()}` : v;
                            }).join(' | ')
                          : formatMoney(t.basePrice)
                        } · {t.unit}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                {activeTemplates.length === 0 && (
                  <Text style={[styles.emptyItemsText, { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 20 }]}>
                    Topilmadi
                  </Text>
                )}
              </ScrollView>
            ) : (
              <View style={{ gap: 14 }}>
                <TouchableOpacity onPress={() => setSelTemplate(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.primary} />
                  <Text style={[styles.backText, { color: colors.primary }]}>{selTemplate.name}</Text>
                </TouchableOpacity>

                {selTemplate.variants.length > 0 && (
                  <View>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tur tanlang</Text>
                    <View style={[styles.variantRow, { marginTop: 8 }]}>
                      {selTemplate.variants.map((v) => {
                        const vp = (selTemplate.variantPrices ?? {})[v];
                        return (
                          <TouchableOpacity
                            key={v}
                            style={[
                              styles.variantChip,
                              { borderColor: colors.border, backgroundColor: colors.background },
                              selVariant === v && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setSelVariant(v)}
                          >
                            <Text style={[styles.variantName, { color: selVariant === v ? '#fff' : colors.foreground }]}>{v}</Text>
                            {vp != null && (
                              <Text style={[styles.variantPrice, { color: selVariant === v ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
                                {vp.toLocaleString()}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {selTemplate.unit === 'dona' ? 'Soni' : selTemplate.unit === 'kg' ? 'Kilogram' : 'Gramm'}
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <MiniStepper value={modalQty} unit={selTemplate.unit} onChange={setModalQty} colors={colors} />
                  </View>
                </View>

                {selTemplate.priceStatus === 'pullik' && (
                  <View style={[styles.pricePreview, { backgroundColor: colors.secondary }]}>
                    <Feather name="tag" size={14} color={colors.primary} />
                    <Text style={[styles.pricePreviewText, { color: colors.foreground }]}>
                      {formatMoney(calcOrderItemSubtotal(selTemplate.unit, modalQty, getVariantPrice(selTemplate, selVariant)))}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={[styles.addModalBtn, { backgroundColor: colors.primary }]} onPress={addItem}>
                  <Text style={styles.addModalBtnText}>Qo'shish</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  nameInput: {
    fontSize: 16, fontFamily: 'Inter_500Medium',
    borderBottomWidth: 1, paddingVertical: 8,
  },
  payRow: { flexDirection: 'row', gap: 10 },
  payChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  payChipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  qarzNote: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 10 },
  qarzNoteText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addItemBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  emptyItems: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyItemsText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, paddingBottom: 10,
  },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemPrice: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemSubtotal: { fontSize: 14, fontFamily: 'Inter_700Bold', minWidth: 60, textAlign: 'right' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: 1, gap: 10,
  },
  footerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  totalValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  confirmBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  tplRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1 },
  tplName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  tplSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  variantName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  variantPrice: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pricePreview: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12 },
  pricePreviewText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  addModalBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  addModalBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
