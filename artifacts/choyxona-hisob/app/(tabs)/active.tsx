import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { GuestSession, OrderItem } from '@/types';

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatElapsed(startStr: string, now: Date): string {
  const start = new Date(startStr);
  const diffMs = now.getTime() - start.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Hozirgina";
  if (diffMin < 60) return `${diffMin} daqiqa`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

function urgencyColor(startStr: string, now: Date, colors: ReturnType<typeof useColors>): string {
  const start = new Date(startStr);
  const diffMin = Math.floor((now.getTime() - start.getTime()) / 60000);
  if (diffMin >= 90) return colors.destructive;
  if (diffMin >= 45) return colors.warning;
  return colors.success;
}

interface SessionAlert {
  session: GuestSession;
  undeliveredItems: OrderItem[];
  isSpecialStatus: boolean; // nosoz or bron
}

export default function ActiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, orders } = useApp();
  const now = useNow();

  // Only show alerts when: undelivered items exist OR location is nosoz/bron
  const alerts: SessionAlert[] = sessions
    .filter((s) => s.status === 'active')
    .map((session) => {
      const sessionOrders = orders[session.id] ?? [];
      const undeliveredItems = sessionOrders.filter((o) => !o.isDelivered);
      const isSpecialStatus = session.reason === 'nosoz' || session.reason === 'bron';
      return { session, undeliveredItems, isSpecialStatus };
    })
    .filter((a) => a.undeliveredItems.length > 0 || a.isSpecialStatus);

  const undeliveredTotal = alerts.reduce((s, a) => s + a.undeliveredItems.length, 0);
  const specialCount = alerts.filter((a) => a.isSpecialStatus && a.undeliveredItems.length === 0).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Faol Ishlar</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {alerts.length > 0
              ? `${alerts.length} ta eslatma bor`
              : "Hamma narsa tartibda"}
          </Text>
        </View>
      </View>

      {/* Summary badges */}
      {alerts.length > 0 && (
        <View style={styles.summaryRow}>
          {undeliveredTotal > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: colors.warning + '18' }]}>
              <Feather name="clock" size={13} color={colors.warning} />
              <Text style={[styles.summaryText, { color: colors.warning }]}>
                {undeliveredTotal} yetkazilmagan mahsulot
              </Text>
            </View>
          )}
          {specialCount > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: colors.destructive + '14' }]}>
              <Feather name="tool" size={13} color={colors.destructive} />
              <Text style={[styles.summaryText, { color: colors.destructive }]}>
                {specialCount} joy nosoz/rezerv
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="check-circle" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Hamma narsa tartibda!
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Yetkazilmagan mahsulot yoki nosoz joy yo'q
            </Text>
          </View>
        ) : (
          alerts.map(({ session, undeliveredItems, isSpecialStatus }) => {
            const elapsed = formatElapsed(session.startTime, now);
            const urgency = isSpecialStatus && undeliveredItems.length === 0
              ? colors.warning
              : urgencyColor(session.startTime, now, colors);
            const diffMin = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 60000);

            return (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.alertCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSpecialStatus && { borderColor: colors.warning + '80' },
                ]}
                onPress={() => session.reason !== 'nosoz' && router.push(`/order/${session.id}`)}
                activeOpacity={0.85}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[
                      styles.locationBadge,
                      { backgroundColor: isSpecialStatus ? colors.warning + '20' : colors.secondary },
                    ]}>
                      <Feather
                        name={session.reason === 'nosoz' ? 'tool' : session.reason === 'bron' ? 'bookmark' : 'map-pin'}
                        size={12}
                        color={isSpecialStatus ? colors.warning : colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={[styles.locationName, { color: colors.foreground }]}>
                        {session.locationName}
                      </Text>
                      <Text style={[styles.guestInfo, { color: colors.mutedForeground }]}>
                        {session.reason === 'nosoz'
                          ? 'Nosoz / Rezerv'
                          : session.reason === 'bron'
                          ? `Bron · ${session.guestCount} kishi`
                          : `${session.guestCount} mehmon`}
                      </Text>
                    </View>
                  </View>

                  {/* Timer — only for regular sessions */}
                  {session.reason !== 'nosoz' && (
                    <View style={[styles.timerBadge, { backgroundColor: urgency + '20', borderColor: urgency + '40' }]}>
                      <Feather name="clock" size={11} color={urgency} />
                      <Text style={[styles.timerText, { color: urgency }]}>{elapsed}</Text>
                    </View>
                  )}
                </View>

                {/* Progress bar — only for regular sessions with time */}
                {session.reason !== 'nosoz' && (
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: urgency,
                          width: `${Math.min(100, (diffMin / 120) * 100)}%` as any,
                        },
                      ]}
                    />
                  </View>
                )}

                {/* Status tags */}
                <View style={styles.tagsRow}>
                  {isSpecialStatus && (
                    <View style={[styles.tag, { backgroundColor: colors.warning + '18' }]}>
                      <Feather
                        name={session.reason === 'nosoz' ? 'tool' : 'bookmark'}
                        size={10}
                        color={colors.warning}
                      />
                      <Text style={[styles.tagText, { color: colors.warning }]}>
                        {session.reason === 'nosoz' ? 'Nosoz / Yopiq' : 'Rezerv / Bron'}
                      </Text>
                    </View>
                  )}
                  {undeliveredItems.length > 0 && (
                    <View style={[styles.tag, { backgroundColor: colors.warning + '18' }]}>
                      <Feather name="alert-triangle" size={10} color={colors.warning} />
                      <Text style={[styles.tagText, { color: colors.warning }]}>
                        {undeliveredItems.length} mahsulot kutilmoqda
                      </Text>
                    </View>
                  )}
                </View>

                {/* Undelivered items list */}
                {undeliveredItems.length > 0 && (
                  <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
                    <Text style={[styles.itemsTitle, { color: colors.mutedForeground }]}>
                      Yetkazilmagan mahsulotlar:
                    </Text>
                    {undeliveredItems.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={[styles.itemDot, { backgroundColor: colors.warning }]} />
                        <Text style={[styles.itemName, { color: colors.foreground }]}>
                          {item.name}
                          {item.variant ? ` (${item.variant})` : ''}
                        </Text>
                        <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                          {item.unit === 'dona'
                            ? `${item.qtyOrWeight} ta`
                            : item.unit === 'kg'
                            ? `${item.qtyOrWeight} kg`
                            : `${item.qtyOrWeight} gr`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action button — only for non-nosoz */}
                {session.reason !== 'nosoz' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/order/${session.id}`)}
                  >
                    <Text style={styles.actionBtnText}>Buyurtmani ko'rish</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap',
  },
  summaryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  summaryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  alertCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  locationName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  guestInfo: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  timerText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  itemsList: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  itemsTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  itemQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 10,
  },
  actionBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
