import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet,
  Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const CLEARABLE = [
  { key: 'templates', label: 'Shablonlar (joylar, mahsulotlar, xizmat)' },
  { key: 'receipts', label: 'Cheklar tarixi' },
  { key: 'debts', label: 'Qarz daftar' },
  { key: 'expenses', label: 'Chiqimlar' },
  { key: 'notes', label: 'Qaydlar' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, isDarkMode, toggleDarkMode, clearData } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === CLEARABLE.length) setSelected(new Set());
    else setSelected(new Set(CLEARABLE.map((c) => c.key)));
  }

  function handleClear() {
    if (selected.size === 0) { Alert.alert('', "O'chirish uchun birini tanlang"); return; }
    const names = [...selected].map((k) => CLEARABLE.find((c) => c.key === k)?.label ?? k).join('\n• ');
    Alert.alert(
      "Haqiqatan ham o'chirmoqchimisiz?",
      `Quyidagilar o'chiriladi:\n• ${names}\n\nBu amalni qaytarib bo'lmaydi.`,
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: () => {
            clearData([...selected]);
            setSelected(new Set());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('Bajarildi', "Ma'lumotlar o'chirildi");
          },
        },
      ]
    );
  }

  function SettingRow({ icon, label, right, onPress }: { icon: string; label: string; right?: React.ReactNode; onPress?: () => void }) {
    return (
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: colors.border }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
          <Feather name={icon as any} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
        {right ?? <View />}
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Profile */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Choyxona</Text>
        <View style={[styles.profileCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.profileIcon, { backgroundColor: colors.primary }]}>
            <Feather name="home" size={22} color="#fff" />
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile?.name ?? '—'}</Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
              Xizmat narxi: {profile ? profile.servicePrice.toLocaleString() + " so'm" : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Ko'rinish</Text>
        <SettingRow
          icon="moon"
          label="Qorong'u rejim"
          right={
            <Switch
              value={isDarkMode}
              onValueChange={() => { toggleDarkMode(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
            />
          }
        />
      </View>

      {/* Data */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Ma'lumotlar va xotira</Text>
        <TouchableOpacity style={styles.selectAll} onPress={toggleAll}>
          <Feather name={selected.size === CLEARABLE.length ? 'check-square' : 'square'} size={16} color={colors.primary} />
          <Text style={[styles.selectAllText, { color: colors.primary }]}>Barchasini tanlash</Text>
        </TouchableOpacity>
        {CLEARABLE.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.checkRow, { borderBottomColor: colors.border }]}
            onPress={() => toggleSelect(item.key)}
          >
            <Feather
              name={selected.has(item.key) ? 'check-square' : 'square'}
              size={18}
              color={selected.has(item.key) ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.checkLabel, { color: colors.foreground }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        {selected.size > 0 && (
          <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.destructive }]} onPress={handleClear}>
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={styles.clearBtnText}>Tanlanganlarni o'chirish ({selected.size})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* About */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Ilova haqida</Text>
        <SettingRow icon="smartphone" label="Versiya" right={<Text style={[styles.version, { color: colors.mutedForeground }]}>1.0.0</Text>} />
        <SettingRow icon="wifi-off" label="Ish rejimi" right={<Text style={[styles.version, { color: colors.success }]}>100% Offline</Text>} />
        <SettingRow icon="globe" label="Platforma" right={<Text style={[styles.version, { color: colors.mutedForeground }]}>Android</Text>} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 12, borderRadius: 12, padding: 12,
  },
  profileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  profileSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  settingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  version: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  selectAll: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  selectAllText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  checkLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 12, borderRadius: 10, paddingVertical: 12,
  },
  clearBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
