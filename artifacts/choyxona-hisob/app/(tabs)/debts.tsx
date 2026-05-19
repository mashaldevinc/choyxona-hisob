import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { DebtRecord } from '@/types';
import { formatMoney, formatDate, generateId, todayStr } from '@/utils/formatting';

type FilterType = 'barchasi' | 'tolanmagan' | 'qisman' | 'tolangan';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'barchasi', label: 'Barchasi' },
  { key: 'tolanmagan', label: "To'lanmagan" },
  { key: 'qisman', label: "Qisman" },
  { key: 'tolangan', label: "To'langan" },
];

export default function DebtsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { debts, addDebt, removeDebt } = useApp();
  const [filter, setFilter] = useState<FilterType>('barchasi');
  const [showModal, setShowModal] = useState(false);
  const [debtorName, setDebtorName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNote, setDebtNote] = useState('');

  const filtered = debts.filter((d) =>
    filter === 'barchasi' ? true : d.status === filter
  );
  const totalActive = debts.filter((d) => d.status !== 'tolandan').reduce((s, d) => s + d.remainingAmount, 0);

  function handleAdd() {
    const name = debtorName.trim();
    const amount = parseFloat(debtAmount);
    if (!name) { Alert.alert('Xato', "Qarzdor ismini kiriting"); return; }
    if (isNaN(amount) || amount <= 0) { Alert.alert('Xato', "Summa kiriting"); return; }
    const debt: DebtRecord = {
      id: generateId(),
      debtorName: name,
      totalDebt: amount,
      paidAmount: 0,
      remainingAmount: amount,
      status: 'tolanmagan',
      installments: [],
      note: debtNote.trim() || undefined,
      createdAt: todayStr(),
    };
    addDebt(debt);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(false);
    setDebtorName('');
    setDebtAmount('');
    setDebtNote('');
  }

  function confirmRemove(id: string) {
    Alert.alert("O'chirish", "Ushbu qarzni o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => removeDebt(id) },
    ]);
  }

  function statusColor(status: string): string {
    if (status === 'tolangan') return colors.success;
    if (status === 'qisman') return colors.warning;
    return colors.destructive;
  }

  function statusLabel(status: string): string {
    if (status === 'tolangan') return "To'langan";
    if (status === 'qisman') return "Qisman to'langan";
    return "To'lanmagan";
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Qarz Daftar</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Jami faol qarz: {formatMoney(totalActive)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { borderColor: colors.border, backgroundColor: colors.card },
              filter === f.key && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: colors.mutedForeground }, filter === f.key && { color: '#fff' }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Qarz yo'q</Text>
          </View>
        }
        renderItem={({ item }) => {
          const paidPercent = item.totalDebt > 0 ? item.paidAmount / item.totalDebt : 0;
          const sc = statusColor(item.status);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/debt/${item.id}`)}
              onLongPress={() => confirmRemove(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.nameRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                    <Feather name="user" size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.debtorName, { color: colors.foreground }]}>{item.debtorName}</Text>
                    <Text style={[styles.debtDate, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc + '20' }]}>
                  <Text style={[styles.statusText, { color: sc }]}>{statusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${paidPercent * 100}%`, backgroundColor: sc }]} />
              </View>

              <View style={styles.amounts}>
                <View>
                  <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Jami qarz</Text>
                  <Text style={[styles.amtValue, { color: colors.foreground }]}>{formatMoney(item.totalDebt)}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>To'langan</Text>
                  <Text style={[styles.amtValue, { color: colors.success }]}>{formatMoney(item.paidAmount)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Qoldiq</Text>
                  <Text style={[styles.amtValue, { color: colors.destructive }]}>{formatMoney(item.remainingAmount)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Yangi qarz</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Qarzdor ismi"
            placeholderTextColor={colors.mutedForeground}
            value={debtorName}
            onChangeText={setDebtorName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Qarz summasi (so'm)"
            placeholderTextColor={colors.mutedForeground}
            value={debtAmount}
            onChangeText={setDebtAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Izoh (ixtiyoriy)"
            placeholderTextColor={colors.mutedForeground}
            value={debtNote}
            onChangeText={setDebtNote}
          />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
            <Text style={styles.confirmBtnText}>Saqlash</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  debtorName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  debtDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  progressBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  amtLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  amtValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  confirmBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
