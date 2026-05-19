import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Expense, ExpenseCategory } from '@/types';
import { formatMoney, formatDate, generateId, todayStr } from '@/utils/formatting';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
  { key: 'oziq-ovqat', label: 'Oziq-ovqat', icon: 'shopping-bag' },
  { key: 'kommunal', label: 'Kommunal', icon: 'zap' },
  { key: 'ish-haqi', label: 'Ish haqi', icon: 'users' },
  { key: 'ijara', label: 'Ijara', icon: 'home' },
  { key: 'boshqa', label: 'Boshqa', icon: 'more-horizontal' },
];

export default function ExpensesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, addExpense, removeExpense } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('oziq-ovqat');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  function handleAdd() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Xato', "Summa kiriting"); return; }
    addExpense({ id: generateId(), category, amount: amt, note: note.trim() || undefined, date: todayStr() });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(false); setAmount(''); setNote('');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.totalCard, { backgroundColor: colors.primary, margin: 16, borderRadius: 16 }]}>
        <Text style={styles.totalLabel}>Jami chiqim</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.secondary, marginHorizontal: 16, borderColor: colors.border }]} onPress={() => setShowModal(true)}>
        <Feather name="plus" size={16} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Chiqim qo'shish</Text>
      </TouchableOpacity>

      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Chiqimlar yo'q</Text>
          </View>
        }
        renderItem={({ item }: { item: Expense }) => {
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onLongPress={() => Alert.alert("O'chirish", "Chiqimni o'chirmoqchimisiz?", [
                { text: 'Bekor', style: 'cancel' },
                { text: "O'chirish", style: 'destructive', onPress: () => removeExpense(item.id) },
              ])}
            >
              <View style={[styles.catIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={(cat?.icon ?? 'circle') as any} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catName, { color: colors.foreground }]}>{cat?.label ?? item.category}</Text>
                {item.note && <Text style={[styles.expNote, { color: colors.mutedForeground }]}>{item.note}</Text>}
                <Text style={[styles.expDate, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
              </View>
              <Text style={[styles.expAmt, { color: colors.destructive }]}>{formatMoney(item.amount)}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Chiqim qo'shish</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.catChip, { borderColor: colors.border, backgroundColor: colors.background }, category === c.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setCategory(c.key)}
              >
                <Feather name={c.icon as any} size={14} color={category === c.key ? '#fff' : colors.primary} />
                <Text style={[styles.catChipText, { color: colors.foreground }, category === c.key && { color: '#fff' }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Summa (so'm)" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="numeric" autoFocus />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Izoh (ixtiyoriy)" placeholderTextColor={colors.mutedForeground} value={note} onChangeText={setNote} />
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
  totalCard: { padding: 20 },
  totalLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  totalValue: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 12, marginBottom: 8 },
  addBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  expNote: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  expDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  expAmt: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  catChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  confirmText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
