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
import { GuestSession, LocationItem } from '@/types';
import { generateId, formatTime, todayStr } from '@/utils/formatting';
import { formatMoney } from '@/utils/formatting';

const REASONS = [
  { key: 'mehmon', label: 'Mehmon keldi' },
  { key: 'bron', label: 'Bron qilingan' },
  { key: 'nosoz', label: 'Nosoz / Rezerv' },
] as const;

export default function GuestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, locations, orders, profile, openSession } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [reason, setReason] = useState<'mehmon' | 'bron' | 'nosoz'>('mehmon');
  const [guestCount, setGuestCount] = useState('1');

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const freeLocations = locations.filter((l) => l.isActive && !l.isBusy);

  function handleBand() {
    if (!selectedLocId) { Alert.alert('Xato', 'Joy tanlang'); return; }
    const gc = parseInt(guestCount, 10);
    if ((reason === 'mehmon' || reason === 'bron') && (isNaN(gc) || gc <= 0)) {
      Alert.alert('Xato', "Mehmonlar sonini kiriting");
      return;
    }
    const loc = locations.find((l) => l.id === selectedLocId);
    if (!loc) return;
    const session: GuestSession = {
      id: generateId(),
      locationId: selectedLocId,
      locationName: loc.displayName,
      guestCount: reason === 'nosoz' ? 0 : gc,
      reason,
      status: 'active',
      startTime: todayStr(),
    };
    openSession(session);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    setSelectedLocId('');
    setGuestCount('1');
    setReason('mehmon');
  }

  function sessionOrderTotal(sessionId: string) {
    return (orders[sessionId] ?? []).reduce((s, o) => s + o.subtotal, 0);
  }

  function undeliveredCount(sessionId: string) {
    return (orders[sessionId] ?? []).filter((o) => !o.isDelivered).length;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Jonli Mehmonlar</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {activeSessions.length} faol · {freeLocations.length} joy bo'sh
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Bandlashtirish</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeSessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        scrollEnabled={!!activeSessions.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="users" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Faol mehmon yo'q</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              "+ Bandlashtirish" tugmasini bosib joy oching
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const undel = undeliveredCount(item.id);
          const total = sessionOrderTotal(item.id);
          const svcTotal = item.guestCount * (profile?.servicePrice ?? 0);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={[styles.locIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.locName, { color: colors.foreground }]}>{item.locationName}</Text>
                    <Text style={[styles.locSub, { color: colors.mutedForeground }]}>
                      {item.guestCount} mehmon · {formatTime(item.startTime)}
                    </Text>
                  </View>
                </View>
                {undel > 0 && (
                  <View style={[styles.alertBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Feather name="alert-triangle" size={11} color={colors.warning} />
                    <Text style={[styles.alertText, { color: colors.warning }]}>{undel}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardBottom}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Hozirgi hisob</Text>
                  <Text style={[styles.totalValue, { color: colors.foreground }]}>
                    {formatMoney(total + svcTotal)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.openBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/order/${item.id}`)}
                >
                  <Text style={styles.openBtnText}>Hisob ochish</Text>
                  <Feather name="arrow-right" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Bandlashtirish Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Bandlashtirish</Text>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Joy tanlang</Text>
          <View style={styles.locGrid}>
            {freeLocations.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.locChip,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  selectedLocId === loc.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedLocId(loc.id)}
              >
                <Text style={[styles.locChipText, { color: colors.foreground }, selectedLocId === loc.id && { color: '#fff' }]}>
                  {loc.displayName}
                </Text>
              </TouchableOpacity>
            ))}
            {freeLocations.length === 0 && (
              <Text style={[styles.noLocText, { color: colors.mutedForeground }]}>
                Barcha joylar band
              </Text>
            )}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Sabab</Text>
          <View style={styles.reasonRow}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.reasonChip,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  reason === r.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setReason(r.key)}
              >
                <Text style={[styles.reasonText, { color: colors.foreground }, reason === r.key && { color: '#fff' }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(reason === 'mehmon' || reason === 'bron') && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mehmonlar soni</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="numeric"
                placeholder="Sonini kiriting"
                placeholderTextColor={colors.mutedForeground}
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={handleBand}
          >
            <Text style={styles.confirmBtnText}>Bandlashtirish</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  locSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  alertBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  alertText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  divider: { height: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  openBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  backdrop: { flex: 1 },
  modal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingTop: 12, gap: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  locGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  locChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  noLocText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  reasonText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  confirmBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  confirmBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
