import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import { OrderItem, TemplateItem } from '@/types';
import { formatMoney, generateId } from '@/utils/formatting';
import { calcOrderItemSubtotal } from '@/utils/calculations';

// Unit step sizes
function getStep(unit: string) {
  if (unit === 'kg') return 0.1;
  if (unit === 'gr') return 50;
  return 1; // dona
}

function formatQty(qty: number, unit: string): string {
  if (unit === 'kg') return qty.toFixed(1);
  if (unit === 'gr') return String(Math.round(qty));
  return String(Math.round(qty));
}

// Big +/- stepper component used in both modal and order cards
function QtyStepper({
  value,
  unit,
  onChange,
  large = false,
  colors,
}: {
  value: number;
  unit: string;
  onChange: (val: number) => void;
  large?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const step = getStep(unit);
  const btnSize = large ? 52 : 36;
  const fontSize = large ? 22 : 16;

  function decrement() {
    const next = Math.max(step, parseFloat((value - step).toFixed(3)));
    onChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function increment() {
    const next = parseFloat((value + step).toFixed(3));
    onChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View style={[stepperStyles.row, large && stepperStyles.rowLarge]}>
      <TouchableOpacity
        onPress={decrement}
        style={[
          stepperStyles.btn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: large ? 14 : 10,
            backgroundColor: colors.secondary,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="minus" size={large ? 20 : 16} color={colors.foreground} />
      </TouchableOpacity>

      <View style={[stepperStyles.valueBox, large && stepperStyles.valueBoxLarge, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[stepperStyles.value, { fontSize, color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          {formatQty(value, unit)}
        </Text>
        <Text style={[stepperStyles.unit, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: large ? 13 : 11 }]}>
          {unit}
        </Text>
      </View>

      <TouchableOpacity
        onPress={increment}
        style={[
          stepperStyles.btn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: large ? 14 : 10,
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
        ]}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="plus" size={large ? 20 : 16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLarge: { gap: 12 },
  btn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  valueBox: {
    minWidth: 72, height: 36, borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  valueBoxLarge: { minWidth: 100, height: 52, borderRadius: 14 },
  value: { textAlign: 'center' },
  unit: { textAlign: 'center', marginTop: 1 },
});

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSession, getOrders, addOrder, updateOrder, removeOrder, toggleDelivered, templates, profile } = useApp();

  const session = getSession(id);
  const orders = getOrders(id);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [modalQty, setModalQty] = useState(1);
  const [search, setSearch] = useState('');

  const serviceTotal = (session?.guestCount ?? 0) * (profile?.servicePrice ?? 0);
  const itemTotal = orders.reduce((s, o) => s + o.subtotal, 0);
  const total = serviceTotal + itemTotal;

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.isActive && t.name.toLowerCase().includes(search.toLowerCase())),
    [templates, search]
  );

  function openAddProduct() {
    setSelectedTemplate(null);
    setSelectedVariant('');
    setModalQty(1);
    setSearch('');
    setShowProductModal(true);
  }

  function selectTemplate(t: TemplateItem) {
    setSelectedTemplate(t);
    setSelectedVariant(t.variants[0] ?? '');
    setModalQty(getStep(t.unit));
  }

  function confirmAdd() {
    if (!selectedTemplate) return;
    if (modalQty <= 0) {
      Alert.alert('Xato', "Miqdorni kiriting");
      return;
    }
    const subtotal = calcOrderItemSubtotal(selectedTemplate.unit, modalQty, selectedTemplate.basePrice);
    const item: OrderItem = {
      id: generateId(),
      templateId: selectedTemplate.id,
      name: selectedTemplate.name,
      variant: selectedVariant || undefined,
      unit: selectedTemplate.unit,
      qtyOrWeight: modalQty,
      unitPrice: selectedTemplate.basePrice,
      subtotal,
      isFree: selectedTemplate.priceStatus === 'bonus',
      isDelivered: false,
    };
    addOrder(id, item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowProductModal(false);
  }

  function handleQtyChange(itemId: string, delta: number) {
    const item = orders.find((o) => o.id === itemId);
    if (!item) return;
    const step = getStep(item.unit);
    const newQty = Math.max(step, parseFloat((item.qtyOrWeight + delta * step).toFixed(3)));
    const newSubtotal = calcOrderItemSubtotal(item.unit, newQty, item.unitPrice);
    updateOrder(id, { ...item, qtyOrWeight: newQty, subtotal: newSubtotal });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleRemove(itemId: string) {
    Alert.alert("O'chirish", "Mahsulotni o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => removeOrder(id, itemId) },
    ]);
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Sessiya topilmadi</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Session info bar */}
      <View style={[styles.sessionBar, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <View style={styles.sessionInfo}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.sessionName, { color: colors.foreground }]}>{session.locationName}</Text>
          <Text style={[styles.sessionDivider, { color: colors.border }]}>·</Text>
          <Feather name="users" size={13} color={colors.mutedForeground} />
          <Text style={[styles.sessionGuests, { color: colors.mutedForeground }]}>{session.guestCount} kishi</Text>
        </View>
        <Text style={[styles.totalPreview, { color: colors.primary }]}>{formatMoney(total)}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 160 }}
        scrollEnabled
        ListHeaderComponent={
          orders.length === 0 ? null : (
            <View style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="coffee" size={14} color={colors.primary} />
              <Text style={[styles.serviceText, { color: colors.foreground }]}>
                Xizmat ({session.guestCount} × {formatMoney(profile?.servicePrice ?? 0)})
              </Text>
              <Text style={[styles.serviceTotal, { color: colors.foreground }]}>{formatMoney(serviceTotal)}</Text>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="shopping-bag" size={34} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Buyurtma yo'q</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Mahsulot qo'shish uchun pastdagi tugmani bosing
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top row: name + delivered toggle */}
            <View style={styles.orderTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.orderNameRow}>
                  <Text style={[styles.orderName, { color: colors.foreground }]}>
                    {item.name}{item.variant ? ` · ${item.variant}` : ''}
                  </Text>
                  {item.isFree && (
                    <View style={[styles.bonusBadge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.bonusText, { color: colors.success }]}>Bonus</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.orderPrice, { color: colors.mutedForeground }]}>
                  {formatMoney(item.unitPrice)} / {item.unit}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.deliveredBtn,
                  { backgroundColor: item.isDelivered ? colors.success : colors.muted },
                ]}
                onPress={() => {
                  toggleDelivered(id, item.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather
                  name={item.isDelivered ? 'check' : 'clock'}
                  size={13}
                  color={item.isDelivered ? '#fff' : colors.warning}
                />
                <Text style={[styles.deliveredText, { color: item.isDelivered ? '#fff' : colors.warning }]}>
                  {item.isDelivered ? 'Yetkazildi' : 'Kutilmoqda'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom row: stepper (ALL units) + subtotal + delete */}
            <View style={styles.orderBottom}>
              <QtyStepper
                value={item.qtyOrWeight}
                unit={item.unit}
                colors={colors}
                onChange={(newQty) => {
                  const newSubtotal = calcOrderItemSubtotal(item.unit, newQty, item.unitPrice);
                  updateOrder(id, { ...item, qtyOrWeight: newQty, subtotal: newSubtotal });
                }}
              />
              <View style={styles.bottomRight}>
                <Text style={[styles.subtotalText, { color: colors.foreground }]}>
                  {item.isFree ? 'Bepul' : formatMoney(item.subtotal)}
                </Text>
                <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom actions */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.addProductBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={openAddProduct}
        >
          <Feather name="plus" size={18} color={colors.primary} />
          <Text style={[styles.addProductText, { color: colors.primary }]}>Mahsulot</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }, orders.length === 0 && { opacity: 0.5 }]}
          onPress={() => orders.length > 0 && router.push(`/checkout/${id}`)}
          disabled={orders.length === 0}
        >
          <Feather name="calculator" size={18} color="#fff" />
          <Text style={styles.checkoutText}>Hisoblash</Text>
        </TouchableOpacity>
      </View>

      {/* Product selection modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={() => setShowProductModal(false)} />
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom + 24, 40),
              },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Mahsulot tanlang</Text>

            <TextInput
              style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Qidirish..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />

            {!selectedTemplate ? (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredTemplates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.templateRow, { borderBottomColor: colors.border }]}
                    onPress={() => selectTemplate(t)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.templateName, { color: colors.foreground }]}>{t.name}</Text>
                      <Text style={[styles.templatePrice, { color: colors.mutedForeground }]}>
                        {t.priceStatus === 'bonus' ? 'Bepul' : formatMoney(t.basePrice)} / {t.unit}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                {filteredTemplates.length === 0 && (
                  <Text style={[styles.noItems, { color: colors.mutedForeground }]}>Mahsulot topilmadi</Text>
                )}
              </ScrollView>
            ) : (
              <View style={{ gap: 16 }}>
                {/* Back + product name */}
                <TouchableOpacity onPress={() => setSelectedTemplate(null)} style={styles.backRow}>
                  <Feather name="arrow-left" size={14} color={colors.primary} />
                  <Text style={[styles.backText, { color: colors.primary }]}>{selectedTemplate.name}</Text>
                </TouchableOpacity>

                {/* Variant chips */}
                {selectedTemplate.variants.length > 0 && (
                  <View>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tur tanlang</Text>
                    <View style={[styles.variantRow, { marginTop: 8 }]}>
                      {selectedTemplate.variants.map((v) => (
                        <TouchableOpacity
                          key={v}
                          style={[
                            styles.variantChip,
                            { borderColor: colors.border, backgroundColor: colors.background },
                            selectedVariant === v && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setSelectedVariant(v)}
                        >
                          <Text style={[styles.variantText, { color: colors.foreground }, selectedVariant === v && { color: '#fff' }]}>
                            {v}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Qty stepper — large version, always +/- for any unit */}
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {selectedTemplate.unit === 'dona' ? 'Soni' : selectedTemplate.unit === 'kg' ? 'Kilogram' : 'Gramm'}
                  </Text>
                  <View style={[styles.stepperWrap]}>
                    <QtyStepper
                      value={modalQty}
                      unit={selectedTemplate.unit}
                      onChange={setModalQty}
                      large
                      colors={colors}
                    />
                  </View>
                </View>

                {/* Price preview */}
                {selectedTemplate.priceStatus === 'pullik' && (
                  <View style={[styles.pricePreview, { backgroundColor: colors.secondary }]}>
                    <Feather name="tag" size={14} color={colors.primary} />
                    <Text style={[styles.pricePreviewText, { color: colors.foreground }]}>
                      {formatMoney(calcOrderItemSubtotal(selectedTemplate.unit, modalQty, selectedTemplate.basePrice))}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={confirmAdd}
                >
                  <Text style={styles.confirmText}>Qo'shish</Text>
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
  sessionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sessionDivider: { fontSize: 14 },
  sessionGuests: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  totalPreview: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  serviceText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  serviceTotal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  orderCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  orderName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  bonusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  bonusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  orderPrice: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  deliveredBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  deliveredText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  orderBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtotalText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  removeBtn: { padding: 4 },
  footer: {
    flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  addProductText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  checkoutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  backdrop: { flex: 1 },
  modal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    gap: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  searchInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: 'Inter_400Regular',
  },
  templateRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1,
  },
  templateName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  templatePrice: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  noItems: { textAlign: 'center', paddingVertical: 20, fontFamily: 'Inter_400Regular' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fieldLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  variantText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  stepperWrap: { marginTop: 8 },
  pricePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 12,
  },
  pricePreviewText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  confirmBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 17 },
});
