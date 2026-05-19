import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
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

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getDebt, addInstallment } = useApp();

  const debt = getDebt(id);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  function handleAdd() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Xato', "Summa kiriting"); return; }
    if (!debt) return;
    if (amt > debt.remainingAmount) {
      Alert.alert('Xato', `Qoldiq qarzdan oshib ketdi (${formatMoney(debt.remainingAmount)})`);
      return;
    }
    const balanceAfter = debt.remainingAmount - amt;
    const installment: Installment = {
      id: generateId(),
      date: todayStr(),
      amount: amt,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.debtorName, { color: colors.foreground }]}>{debt.debtorName}</Text>
              <Text style={[styles.debtDate, { color: colors.mutedForeground }]}>{formatDate(debt.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${paidPercent * 100}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>
            {(paidPercent * 100).toFixed(0)}% to'langan
          </Text>

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

      {debt.status !== 'tolangan' && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.payBtnText}>To'lov qo'shish</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>To'lov qo'shish</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            Qoldiq: {formatMoney(debt.remainingAmount)}
          </Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="To'lov summasi (so'm)"
            placeholderTextColor={colors.mutedForeground}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            autoFocus
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Izoh (ixtiyoriy)"
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
            <Text style={styles.confirmText}>Saqlash</Text>
          </TouchableOpacity>
        </View>
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
  statusBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amtItem: {},
  amtLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  amtValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8 },
  noteText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyPayments: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  instCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  instNum: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  instNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  instAmt: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  instDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  instNote: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  instBalLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  instBal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  payBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  confirmText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
