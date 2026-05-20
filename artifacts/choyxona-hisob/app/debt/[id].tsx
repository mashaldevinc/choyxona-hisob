import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
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
import { Installment } from '@/types';
import { formatMoney, formatDate, formatDateTime, generateId, todayStr } from '@/utils/formatting';

const QUICK_PERCENTS = [
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: '75%', pct: 0.75 },
  { label: "To'liq", pct: 1 },
];

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getDebt, addInstallment } = useApp();

  const debt = getDebt(id);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  function openModal() {
    setAmount('');
    setNote('');
    setShowModal(true);
  }

  function applyPercent(pct: number) {
    if (!debt) return;
    const val = Math.round(debt.remainingAmount * pct);
    setAmount(String(val));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAdd() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Xato', "Summa kiriting"); return; }
    if (!debt) return;
    if (amt > debt.remainingAmount + 0.5) {
      Alert.alert('Xato', `Qoldiq qarzdan oshib ketdi (${formatMoney(debt.remainingAmount)})`);
      return;
    }
    const finalAmt = Math.min(amt, debt.remainingAmount);
    const balanceAfter = Math.max(0, debt.remainingAmount - finalAmt);
    const installment: Installment = {
      id: generateId(),
      date: todayStr(),
      amount: finalAmt,
      note: note.trim() || undefined,
      balanceAfter,
    };
    addInstallment(id, installment);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    setAmount('');
    setNote('');
  }

  if (!debt) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Qarz topilmadi</Text>
      </View>
    );
  }

  const paidPercent = debt.totalDebt > 0 ? debt.paidAmount / debt.totalDebt : 0;
  const statusColor = debt.status === 'tolangan' ? colors.success : debt.status === 'qisman' ? colors.warning : colors.destructive;
  const statusLabel = debt.status === 'tolangan' ? "To'langan" : debt.status === 'qisman' ? "Qisman to'langan" : "To'lanmagan";

  const amtNum = parseFloat(amount);
  const isValidAmt = !isNaN(amtNum) && amtNum > 0 && amtNum <= debt.remainingAmount + 0.5;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.debtorName, { color: colors.foreground }]}>{debt.debtorName}</Text>
              <Text style={[styles.debtDate, { color: colors.mutedForeground }]}>{formatDate(debt.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${paidPercent * 100}%` as any, backgroundColor: statusColor }]} />
          </View>
          <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>
            {(paidPercent * 100).toFixed(0)}% to'langan
          </Text>

          {/* Amounts */}
          <View style={styles.amountsRow}>
            <View style={styles.amtItem}>
              <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Jami qarz</Text>
              <Text style={[styles.amtValue, { color: colors.foreground }]}>{formatMoney(debt.totalDebt)}</Text>
            </View>
            <View style={styles.amtItem}>
              <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>To'langan</Text>
              <Text style={[styles.amtValue, { color: colors.success }]}>{formatMoney(debt.paidAmount)}</Text>
            </View>
            <View style={styles.amtItem}>
              <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Qoldiq</Text>
              <Text style={[styles.amtValue, { color: colors.destructive }]}>{formatMoney(debt.remainingAmount)}</Text>
            </View>
          </View>

          {debt.note && (
            <View style={[styles.noteBox, { backgroundColor: colors.secondary }]}>
              <Feather name="file-text" size={12} color={colors.mutedForeground} />
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>{debt.note}</Text>
            </View>
          )}
        </View>

        {/* Payment history */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>To'lov tarixi</Text>
        {debt.installments.length === 0 ? (
          <View style={[styles.emptyPayments, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Hali to'lov qilinmagan</Text>
          </View>
        ) : (
          debt.installments.map((inst, i) => (
            <View key={inst.id} style={[styles.instCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.instNum, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.instNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.instAmt, { color: colors.success }]}>+ {formatMoney(inst.amount)}</Text>
                <Text style={[styles.instDate, { color: colors.mutedForeground }]}>{formatDateTime(inst.date)}</Text>
                {inst.note && <Text style={[styles.instNote, { color: colors.mutedForeground }]}>{inst.note}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.instBalLabel, { color: colors.mutedForeground }]}>Qoldiq</Text>
                <Text style={[styles.instBal, { color: colors.foreground }]}>{formatMoney(inst.balanceAfter)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      {debt.status !== 'tolangan' && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Qoldiq qarz:</Text>
            <Text style={[styles.footerAmount, { color: colors.destructive }]}>{formatMoney(debt.remainingAmount)}</Text>
          </View>
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={openModal}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.payBtnText}>To'lov qo'shish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
          <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>To'lov qo'shish</Text>
            <View style={[styles.remainingRow, { backgroundColor: colors.secondary }]}>
              <Feather name="alert-circle" size={14} color={colors.primary} />
              <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>Qoldiq qarz:</Text>
              <Text style={[styles.remainingAmt, { color: colors.destructive }]}>{formatMoney(debt.remainingAmount)}</Text>
            </View>

            {/* Quick percent buttons */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tezkor miqdor</Text>
              <View style={styles.percentRow}>
                {QUICK_PERCENTS.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.percentChip,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      p.pct === 1 && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => applyPercent(p.pct)}
                  >
                    <Text style={[
                      styles.percentText,
                      { color: p.pct === 1 ? '#fff' : colors.foreground },
                    ]}>
                      {p.label}
                    </Text>
                    {p.pct < 1 && (
                      <Text style={[styles.percentAmt, { color: colors.mutedForeground }]}>
                        {formatMoney(Math.round(debt.remainingAmount * p.pct))}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Manual amount input */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Summa (so'm)</Text>
              <View style={[styles.amtInputRow, { borderColor: isValidAmt ? colors.primary : colors.border, backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.amtInput, { color: colors.foreground }]}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  autoFocus
                />
                {amount !== '' && (
                  <TouchableOpacity onPress={() => setAmount('')} style={styles.clearBtn}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              {isValidAmt && (
                <Text style={[styles.changeHint, { color: colors.success }]}>
                  To'lovdan keyin qoladi: {formatMoney(Math.max(0, debt.remainingAmount - amtNum))}
                </Text>
              )}
            </View>

            {/* Note */}
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }, !isValidAmt && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!isValidAmt}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.confirmText}>To'lovni tasdiqlash</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  debtorName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  debtDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  progressBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressPct: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amtItem: {},
  amtLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  amtValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8 },
  noteText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyPayments: { borderRadius: 12, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  instCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  instNum: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  instNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  instAmt: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  instDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  instNote: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  instBalLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  instBal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0, gap: 8 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  footerAmount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  payBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  remainingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 12,
  },
  remainingLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  remainingAmt: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  percentRow: { flexDirection: 'row', gap: 8 },
  percentChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  percentText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  percentAmt: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  amtInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  amtInput: { flex: 1, fontSize: 26, fontFamily: 'Inter_700Bold', paddingVertical: 10 },
  clearBtn: { padding: 6 },
  changeHint: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  confirmBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  confirmText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
