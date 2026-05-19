import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { DebtRecord, ForgottenItem, Receipt } from '@/types';
import { formatMoney, formatDate, formatTime, generateId, todayStr } from '@/utils/formatting';
import { calculateBill } from '@/utils/calculations';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSession, getOrders, profile, addReceipt, addDebt, closeSession } = useApp();

  const session = getSession(id);
  const orders = getOrders(id);

  const [discountPct, setDiscountPct] = useState('0');
  const [vatPct, setVatPct] = useState('0');
  const [partialPayment, setPartialPayment] = useState('');
  const [debtorName, setDebtorName] = useState('');
  const [forgottenItems, setForgottenItems] = useState<ForgottenItem[]>([]);
  const [forgottenName, setForgottenName] = useState('');
  const [forgottenAmt, setForgottenAmt] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);

  const bill = useMemo(() => {
    const disc = Math.max(0, Math.min(100, parseFloat(discountPct) || 0));
    const vat = Math.max(0, Math.min(100, parseFloat(vatPct) || 0));
    return calculateBill(
      session?.guestCount ?? 0,
      profile?.servicePrice ?? 0,
      orders,
      forgottenItems,
      disc,
      vat
    );
  }, [session, profile, orders, forgottenItems, discountPct, vatPct]);

  const partialAmt = parseFloat(partialPayment) || 0;
  const remainingDebt = bill.finalTotal - partialAmt;

  function addForgotten() {
    const amt = parseFloat(forgottenAmt);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Xato', "Summa kiriting"); return; }
    setForgottenItems((prev) => [...prev, { id: generateId(), name: forgottenName.trim() || undefined, amount: amt }]);
    setForgottenName('');
    setForgottenAmt('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleFinalize() {
    if (partialAmt > bill.finalTotal) {
      Alert.alert('Xato', "To'lov summasi jami hisobdan oshib ketdi");
      return;
    }
    const hasPartial = partialAmt > 0 && partialAmt < bill.finalTotal;
    if (hasPartial && !debtorName.trim()) {
      Alert.alert('Xato', "Qisman to'lovda qarzdor ismini kiriting");
      return;
    }

    const now = todayStr();
    const receipt: Receipt = {
      id: generateId(),
      sessionId: id,
      locationName: session?.locationName ?? '',
      guestCount: session?.guestCount ?? 0,
      startTime: session?.startTime ?? now,
      items: orders,
      serviceTotal: bill.serviceTotal,
      forgottenItems,
      subtotal: bill.subtotal,
      discountPercent: parseFloat(discountPct) || 0,
      discountAmount: bill.discountAmount,
      vatPercent: parseFloat(vatPct) || 0,
      vatAmount: bill.vatAmount,
      finalTotal: bill.finalTotal,
      cashRounded: bill.cashRounded,
      partialPayment: partialAmt,
      timestamp: now,
    };

    if (hasPartial) {
      const debt: DebtRecord = {
        id: generateId(),
        debtorName: debtorName.trim(),
        totalDebt: remainingDebt,
        paidAmount: 0,
        remainingAmount: remainingDebt,
        status: 'tolanmagan',
        installments: [],
        note: `${session?.locationName} - chek`,
        createdAt: now,
        receiptId: receipt.id,
      };
      addDebt(debt);
    }

    addReceipt(receipt);
    closeSession(id);
    setSavedReceipt(receipt);
    setShowReceipt(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function buildReceiptText(r: Receipt): string {
    const lines: string[] = [];
    lines.push(`Choyxona: ${profile?.name ?? ''}`);
    lines.push(`Sana: ${formatDate(r.timestamp)}  |  Mehmonlar: ${r.guestCount}  |  Vaqt: ${formatTime(r.startTime)} – ${formatTime(r.timestamp)}`);
    lines.push('—'.repeat(40));
    lines.push(`Xizmat-salfetka: ${r.guestCount} × ${formatMoney(profile?.servicePrice ?? 0)} = ${formatMoney(r.serviceTotal)}`);
    for (const item of r.items) {
      const unitStr = item.unit === 'dona' ? `${item.qtyOrWeight} ta` : `${item.qtyOrWeight} ${item.unit}`;
      lines.push(`${item.name}${item.variant ? ` (${item.variant})` : ''} [${unitStr}]: ${item.isFree ? "Bepul" : formatMoney(item.subtotal)}`);
    }
    for (const fi of r.forgottenItems) {
      lines.push(`${fi.name ?? 'Unutilgan narsa'}: ${formatMoney(fi.amount)}`);
    }
    lines.push('—'.repeat(40));
    lines.push(`Umumiy: ${formatMoney(r.subtotal)}`);
    if (r.discountPercent > 0) lines.push(`Chegirma: ${r.discountPercent}% → – ${formatMoney(r.discountAmount)}`);
    if (r.vatPercent > 0) lines.push(`QQS: ${r.vatPercent}% → + ${formatMoney(r.vatAmount)}`);
    lines.push(`To'lanadi: ${formatMoney(r.finalTotal)}`);
    lines.push(`Naqd ko'rinishda: ${formatMoney(r.cashRounded)}`);
    if (r.partialPayment > 0) lines.push(`To'landi: ${formatMoney(r.partialPayment)} | Qarz: ${formatMoney(r.finalTotal - r.partialPayment)}`);
    lines.push('—'.repeat(40));
    lines.push("Xizmatimizdan foydalanganingiz uchun rahmat!");
    return lines.join('\n');
  }

  async function shareReceipt() {
    if (!savedReceipt) return;
    await Share.share({ message: buildReceiptText(savedReceipt) });
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140 }}>
        {/* Items summary */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Buyurtmalar</Text>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Feather name="coffee" size={13} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Xizmat ({session.guestCount} kishi)
            </Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>{formatMoney(bill.serviceTotal)}</Text>
          </View>
          {orders.map((item) => (
            <View key={item.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>
                {item.name}{item.variant ? ` (${item.variant})` : ''}
                {' · '}{item.unit === 'dona' ? `${item.qtyOrWeight} ta` : `${item.qtyOrWeight} ${item.unit}`}
              </Text>
              <Text style={[styles.rowValue, { color: item.isFree ? colors.success : colors.foreground }]}>
                {item.isFree ? 'Bepul' : formatMoney(item.subtotal)}
              </Text>
            </View>
          ))}
          {forgottenItems.map((fi) => (
            <View key={fi.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{fi.name ?? 'Unutilgan narsa'}</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{formatMoney(fi.amount)}</Text>
                <TouchableOpacity onPress={() => setForgottenItems((p) => p.filter((f) => f.id !== fi.id))}>
                  <Feather name="x" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Forgotten items */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unutilgan narsalar</Text>
          <View style={styles.forgottenRow}>
            <TextInput
              style={[styles.input, { flex: 1.5, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Nomi (ixtiyoriy)"
              placeholderTextColor={colors.mutedForeground}
              value={forgottenName}
              onChangeText={setForgottenName}
            />
            <TextInput
              style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Summa"
              placeholderTextColor={colors.mutedForeground}
              value={forgottenAmt}
              onChangeText={setForgottenAmt}
              keyboardType="numeric"
            />
            <TouchableOpacity style={[styles.addForgBtn, { backgroundColor: colors.secondary }]} onPress={addForgotten}>
              <Feather name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Discount & VAT */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chegirma va QQS</Text>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Chegirma (%)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={discountPct}
                onChangeText={setDiscountPct}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>QQS (%)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={vatPct}
                onChangeText={setVatPct}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hisob</Text>
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.mutedForeground }]}>Jami</Text>
            <Text style={[styles.calcValue, { color: colors.foreground }]}>{formatMoney(bill.subtotal)}</Text>
          </View>
          {bill.discountAmount > 0 && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.mutedForeground }]}>Chegirma ({discountPct}%)</Text>
              <Text style={[styles.calcValue, { color: colors.success }]}>– {formatMoney(bill.discountAmount)}</Text>
            </View>
          )}
          {bill.vatAmount > 0 && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.mutedForeground }]}>QQS ({vatPct}%)</Text>
              <Text style={[styles.calcValue, { color: colors.destructive }]}>+ {formatMoney(bill.vatAmount)}</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.calcRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>To'lanadi</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatMoney(bill.finalTotal)}</Text>
          </View>
          <View style={[styles.naqd, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.naqdLabel, { color: colors.mutedForeground }]}>Naqd (yaxlitlangan)</Text>
            <Text style={[styles.naqdValue, { color: colors.foreground }]}>{formatMoney(bill.cashRounded)}</Text>
          </View>
        </View>

        {/* Partial payment */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Qisman to'lov</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            placeholder={`To'langan summa (max: ${bill.finalTotal.toFixed(0)})`}
            placeholderTextColor={colors.mutedForeground}
            value={partialPayment}
            onChangeText={setPartialPayment}
            keyboardType="numeric"
          />
          {partialAmt > 0 && partialAmt < bill.finalTotal && (
            <>
              <View style={[styles.debtWarning, { backgroundColor: colors.warning + '20' }]}>
                <Feather name="alert-triangle" size={13} color={colors.warning} />
                <Text style={[styles.debtWarningText, { color: colors.warning }]}>
                  Qarz daftariga o'tadi: {formatMoney(remainingDebt)}
                </Text>
              </View>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                placeholder="Qarzdor ismi va familiyasi (majburiy)"
                placeholderTextColor={colors.mutedForeground}
                value={debtorName}
                onChangeText={setDebtorName}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={[styles.finalBtn, { backgroundColor: colors.primary }]} onPress={handleFinalize}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.finalBtnText}>Chek yaratish</Text>
        </TouchableOpacity>
      </View>

      {/* Receipt modal */}
      <Modal visible={showReceipt} transparent animationType="fade">
        <View style={[styles.receiptBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.receiptModal, { backgroundColor: colors.card }]}>
            <View style={[styles.receiptCheck, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.receiptTitle, { color: colors.foreground }]}>Chek tayyor!</Text>
            {savedReceipt && (
              <>
                <Text style={[styles.receiptSum, { color: colors.primary }]}>{formatMoney(savedReceipt.finalTotal)}</Text>
                <Text style={[styles.receiptMeta, { color: colors.mutedForeground }]}>
                  {savedReceipt.locationName} · {savedReceipt.guestCount} mehmon
                </Text>
                {savedReceipt.partialPayment > 0 && (
                  <View style={[styles.debtWarning, { backgroundColor: colors.warning + '20' }]}>
                    <Feather name="book-open" size={13} color={colors.warning} />
                    <Text style={[styles.debtWarningText, { color: colors.warning }]}>
                      Qarz qo'shildi: {formatMoney(savedReceipt.finalTotal - savedReceipt.partialPayment)}
                    </Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.secondary }]}
                onPress={shareReceipt}
              >
                <Feather name="share-2" size={16} color={colors.primary} />
                <Text style={[styles.shareBtnText, { color: colors.primary }]}>Ulashish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setShowReceipt(false); router.replace('/(tabs)'); }}
              >
                <Text style={styles.doneBtnText}>Tugash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1 },
  rowLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forgottenRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addForgBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  twoCol: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  calcLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  calcValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  naqd: { borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  naqdLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  naqdValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  debtWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8 },
  debtWarningText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  finalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  finalBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 17 },
  receiptBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  receiptModal: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', gap: 12 },
  receiptCheck: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  receiptTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  receiptSum: { fontSize: 30, fontFamily: 'Inter_700Bold' },
  receiptMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  receiptActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  doneBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
