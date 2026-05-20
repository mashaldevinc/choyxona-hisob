import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDateTime } from '@/utils/formatting';

type FilterType = 'barchasi' | 'cheklar' | 'sotuv';

export default function ReceiptsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { receipts, quickSales } = useApp();
  const [filter, setFilter] = useState<FilterType>('barchasi');

  const combined = useMemo(() => {
    const r = receipts.map((x) => ({ ...x, _type: 'receipt' as const }));
    const q = (quickSales ?? []).map((x) => ({ ...x, _type: 'quicksale' as const }));
    const all = [...r, ...q].sort((a, b) => {
      const ta = 'timestamp' in a ? a.timestamp : '';
      const tb = 'timestamp' in b ? b.timestamp : '';
      return tb.localeCompare(ta);
    });

    if (filter === 'cheklar') return all.filter((x) => x._type === 'receipt');
    if (filter === 'sotuv') return all.filter((x) => x._type === 'quicksale');
    return all;
  }, [receipts, quickSales, filter]);

  const totalSum = useMemo(() => {
    if (filter === 'cheklar') return receipts.reduce((s, r) => s + r.finalTotal, 0);
    if (filter === 'sotuv') return (quickSales ?? []).filter((q) => q.paymentType === 'naqd').reduce((s, q) => s + q.total, 0);
    return receipts.reduce((s, r) => s + r.finalTotal, 0)
      + (quickSales ?? []).filter((q) => q.paymentType === 'naqd').reduce((s, q) => s + q.total, 0);
  }, [receipts, quickSales, filter]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'barchasi', label: 'Barchasi' },
    { key: 'cheklar', label: 'Cheklar' },
    { key: 'sotuv', label: 'Tezkor sotuv' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Cheklar</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {combined.length} ta yozuv · {formatMoney(totalSum)}
          </Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: filter === f.key ? colors.primary : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={combined}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="file-text" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Yozuvlar yo'q</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Yopilgan hisoblar va tezkor sotuvlar bu yerda ko'rinadi
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item._type === 'receipt') {
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/checkout/${item.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                    <Feather name="file-text" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locName, { color: colors.foreground }]}>{item.locationName}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      {item.guestCount} mehmon · {formatDateTime(item.timestamp)}
                    </Text>
                  </View>
                  {item.partialPayment > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.warning }]}>Qarz</Text>
                    </View>
                  )}
                  <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>Chek</Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Jami</Text>
                    <Text style={[styles.amtValue, { color: colors.foreground }]}>{formatMoney(item.finalTotal)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Naqd</Text>
                    <Text style={[styles.amtValue, { color: colors.primary }]}>{formatMoney(item.cashRounded)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // Quick sale card
          const qs = item as typeof item & { _type: 'quicksale' };
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.icon, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name="shopping-cart" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locName, { color: colors.foreground }]}>{qs.buyerName}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {qs.items.length} mahsulot · {formatDateTime(qs.timestamp)}
                  </Text>
                </View>
                <View style={[
                  styles.badge,
                  { backgroundColor: qs.paymentType === 'naqd' ? colors.success + '20' : colors.warning + '20' },
                ]}>
                  <Text style={[styles.badgeText, { color: qs.paymentType === 'naqd' ? colors.success : colors.warning }]}>
                    {qs.paymentType === 'naqd' ? 'Naqd' : 'Qarz'}
                  </Text>
                </View>
              </View>
              {/* Items brief */}
              <Text style={[styles.itemsBrief, { color: colors.mutedForeground }]} numberOfLines={1}>
                {qs.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ''} ×${i.qtyOrWeight}`).join(', ')}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardBottom}>
                <View>
                  <Text style={[styles.amtLabel, { color: colors.mutedForeground }]}>Jami</Text>
                  <Text style={[styles.amtValue, { color: colors.foreground }]}>{formatMoney(qs.total)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>Tezkor sotuv</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  filterRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: 16, marginBottom: 4,
  },
  filterBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  itemsBrief: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  divider: { height: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amtLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  amtValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
});
