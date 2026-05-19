import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { Receipt } from '@/types';

export default function ReceiptsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { receipts } = useApp();

  const totalSum = receipts.reduce((s, r) => s + r.finalTotal, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Cheklar</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {receipts.length} ta chek · {formatMoney(totalSum)}
          </Text>
        </View>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        scrollEnabled={!!receipts.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="file-text" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Cheklar yo'q</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Hisobni yopgandan so'ng cheklar bu yerda ko'rinadi
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Receipt }) => (
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
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amtLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  amtValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
});
