import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { formatMoney, isSameDay, todayStr } from '@/utils/formatting';

function StatCard({
  label,
  value,
  icon,
  accent,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, {
      backgroundColor: accent ? colors.primary : colors.card,
      borderColor: colors.border,
    }]}>
      <View style={[styles.statIcon, { backgroundColor: accent ? 'rgba(255,255,255,0.2)' : colors.secondary }]}>
        <Feather name={icon as any} size={16} color={accent ? '#fff' : colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: accent ? '#fff' : colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: accent ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function QuickBtn({
  icon,
  label,
  onPress,
  colors,
  highlight,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickBtn,
        highlight
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: highlight ? 'rgba(255,255,255,0.2)' : colors.secondary }]}>
        <Feather name={icon as any} size={20} color={highlight ? '#fff' : colors.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: highlight ? '#fff' : colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, sessions, receipts, expenses, debts, orders, quickSales } = useApp();
  const today = todayStr();

  const stats = useMemo(() => {
    const todayReceipts = receipts.filter((r) => isSameDay(r.timestamp, today));
    const todayQuickSales = (quickSales ?? []).filter((q) => isSameDay(q.timestamp, today) && q.paymentType === 'naqd');
    const todayExpenses = expenses.filter((e) => isSameDay(e.date, today));
    const todayIncome = todayReceipts.reduce((s, r) => s + r.finalTotal, 0)
      + todayQuickSales.reduce((s, q) => s + q.total, 0);
    const todayExpense = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const activeSessions = sessions.filter((s) => s.status === 'active');
    const activeDebts = debts.filter((d) => d.status !== 'tolangan');
    const totalDebt = activeDebts.reduce((s, d) => s + d.remainingAmount, 0);
    const todayGuests = todayReceipts.reduce((s, r) => s + r.guestCount, 0);
    const avgCheck = todayReceipts.length > 0 ? todayIncome / todayReceipts.length : 0;

    const activeOrderTotal = activeSessions.reduce((sum, ses) => {
      const sessionOrders = orders[ses.id] ?? [];
      return sum + sessionOrders.reduce((s, o) => s + o.subtotal, 0);
    }, 0);

    return {
      todayIncome,
      todayExpense,
      netIncome: todayIncome - todayExpense,
      activeCount: activeSessions.length,
      activeDebtCount: activeDebts.length,
      totalDebt,
      todayGuests,
      avgCheck,
      activeOrderTotal,
      receiptCount: todayReceipts.length,
    };
  }, [receipts, expenses, sessions, debts, orders, quickSales, today]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Xush kelibsiz</Text>
          <Text style={[styles.shopName, { color: colors.foreground }]}>
            {profile?.name ?? 'Choyxona'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Feather name="settings" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Main income card */}
      <View style={[styles.mainCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.mainLabel}>Bugungi daromad</Text>
        <Text style={styles.mainValue}>{formatMoney(stats.todayIncome)}</Text>
        <View style={styles.mainRow}>
          <View style={styles.mainSubItem}>
            <Feather name="trending-down" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.mainSubText}>Chiqim: {formatMoney(stats.todayExpense)}</Text>
          </View>
          <View style={styles.mainSubItem}>
            <Feather name="activity" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.mainSubText}>Sof: {formatMoney(stats.netIncome)}</Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Faol stollar" value={String(stats.activeCount)} icon="grid" colors={colors} />
        <StatCard label="Bugungi mehmonlar" value={String(stats.todayGuests)} icon="users" colors={colors} />
        <StatCard label="Faol qarzlar" value={String(stats.activeDebtCount)} icon="alert-circle" colors={colors} />
        <StatCard label="Jami qarz" value={formatMoney(stats.totalDebt)} icon="book-open" colors={colors} />
        <StatCard label="Bugungi cheklar" value={String(stats.receiptCount)} icon="file-text" colors={colors} />
        <StatCard label="O'rtacha chek" value={formatMoney(stats.avgCheck)} icon="bar-chart-2" colors={colors} />
      </View>

      {/* Quick Sale CTA */}
      <View style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.saleTitle, { color: colors.foreground }]}>Tezkor sotuv</Text>
          <Text style={[styles.saleDesc, { color: colors.mutedForeground }]}>
            Stol bandlamasiz mahsulot sotish
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saleBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/quick-sale')}
        >
          <Feather name="shopping-cart" size={16} color="#fff" />
          <Text style={styles.saleBtnText}>Sotuv qo'shish</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tezkor o'tish</Text>
      <View style={styles.quickGrid}>
        <QuickBtn icon="layout" label="Shablonlar" onPress={() => router.push('/templates')} colors={colors} />
        <QuickBtn icon="trending-down" label="Chiqimlar" onPress={() => router.push('/expenses')} colors={colors} />
        <QuickBtn icon="edit-3" label="Qaydlar" onPress={() => router.push('/notes')} colors={colors} />
        <QuickBtn icon="settings" label="Sozlamalar" onPress={() => router.push('/settings')} colors={colors} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  shopName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  mainCard: {
    marginHorizontal: 20, borderRadius: 16,
    padding: 20, marginBottom: 16,
  },
  mainLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  mainValue: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 12 },
  mainRow: { flexDirection: 'row', gap: 16 },
  mainSubItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mainSubText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 16,
  },
  statCard: {
    width: '47%', borderRadius: 12, padding: 14,
    borderWidth: 1,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  saleCard: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  saleTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  saleDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  saleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  saleBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  sectionTitle: {
    fontSize: 16, fontFamily: 'Inter_700Bold',
    paddingHorizontal: 20, marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
  },
  quickBtn: {
    width: '47%', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  quickLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});
