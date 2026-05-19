import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import { generateId, todayStr } from '@/utils/formatting';
import { LocationItem, TemplateItem, TeaHouseProfile } from '@/types';

const STEPS = ['Choyxona', 'Joylar', 'Mahsulotlar', 'Xizmat'];
const UNIT_OPTIONS = ['dona', 'kg', 'gr'] as const;
const PRICE_OPTIONS = ['pullik', 'bonus'] as const;

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeSetup } = useApp();

  const [step, setStep] = useState(0);
  const [choyxonaName, setChoyxonaName] = useState('');
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locTypeName, setLocTypeName] = useState('');
  const [locCount, setLocCount] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [productName, setProductName] = useState('');
  const [productUnit, setProductUnit] = useState<'dona' | 'kg' | 'gr'>('dona');
  const [productPriceStatus, setProductPriceStatus] = useState<'pullik' | 'bonus'>('pullik');
  const [productPrice, setProductPrice] = useState('');
  const [productVariants, setProductVariants] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const s = makeStyles(colors, insets);

  function addLocationType() {
    const name = locTypeName.trim();
    const count = parseInt(locCount, 10);
    if (!name || isNaN(count) || count <= 0) {
      Alert.alert('Xato', "Joy turi va sonini to'g'ri kiriting");
      return;
    }
    const existing = locations.filter((l) => l.typeName === name).length;
    const newLocs: LocationItem[] = [];
    for (let i = 1; i <= count; i++) {
      newLocs.push({
        id: generateId(),
        typeName: name,
        displayName: `${existing + i}-${name}`,
        autoIndex: existing + i,
        isActive: true,
        isBusy: false,
      });
    }
    setLocations((prev) => [...prev, ...newLocs]);
    setLocTypeName('');
    setLocCount('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function renameLocation(id: string, newName: string) {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, displayName: newName } : l))
    );
  }

  function removeLocation(id: string) {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }

  function addProduct() {
    const name = productName.trim();
    if (!name) {
      Alert.alert('Xato', "Mahsulot nomini kiriting");
      return;
    }
    if (productPriceStatus === 'pullik' && (!productPrice || isNaN(parseFloat(productPrice)))) {
      Alert.alert('Xato', "Narxni kiriting");
      return;
    }
    const variants = productVariants
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const item: TemplateItem = {
      id: generateId(),
      name,
      unit: productUnit,
      priceStatus: productPriceStatus,
      basePrice: productPriceStatus === 'bonus' ? 0 : parseFloat(productPrice),
      variants,
      isActive: true,
    };
    setTemplates((prev) => [...prev, item]);
    setProductName('');
    setProductPrice('');
    setProductVariants('');
    setProductUnit('dona');
    setProductPriceStatus('pullik');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function finish() {
    const sp = parseFloat(servicePrice);
    if (isNaN(sp) || sp < 0) {
      Alert.alert('Xato', "Xizmat narxini kiriting");
      return;
    }
    const profile: TeaHouseProfile = {
      id: generateId(),
      name: choyxonaName.trim(),
      servicePrice: sp,
      createdAt: todayStr(),
    };
    await completeSetup(profile, locations, templates);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }

  function nextStep() {
    if (step === 0 && !choyxonaName.trim()) {
      Alert.alert('Xato', "Choyxona nomini kiriting");
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Sozlash</Text>
        <View style={s.stepsRow}>
          {STEPS.map((label, i) => (
            <View key={i} style={s.stepItem}>
              <View style={[s.stepDot, i <= step && s.stepDotActive]}>
                {i < step ? (
                  <Feather name="check" size={12} color="#fff" />
                ) : (
                  <Text style={[s.stepNum, i === step && { color: '#fff' }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[s.stepLabel, i === step && { color: colors.primary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.body}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View>
              <Text style={s.stepTitle}>Choyxona nomini kiriting</Text>
              <Text style={s.hint}>Bu nom barcha cheklarda ko'rsatiladi</Text>
              <TextInput
                style={s.input}
                placeholder="Masalan: Bahor Choyxonasi"
                placeholderTextColor={colors.mutedForeground}
                value={choyxonaName}
                onChangeText={setChoyxonaName}
                autoFocus
              />
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={s.stepTitle}>Joylarni yarating</Text>
              <Text style={s.hint}>Joy turi va nechtaligini kiriting</Text>
              <View style={s.row}>
                <TextInput
                  style={[s.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Tur nomi (Xona, Stol...)"
                  placeholderTextColor={colors.mutedForeground}
                  value={locTypeName}
                  onChangeText={setLocTypeName}
                />
                <TextInput
                  style={[s.input, { width: 70 }]}
                  placeholder="Soni"
                  placeholderTextColor={colors.mutedForeground}
                  value={locCount}
                  onChangeText={setLocCount}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={s.addBtn} onPress={addLocationType}>
                <Feather name="plus" size={16} color={colors.primaryForeground} />
                <Text style={s.addBtnText}>Qo'shish</Text>
              </TouchableOpacity>

              {locations.length > 0 && (
                <View style={s.listCard}>
                  {locations.map((loc) => (
                    <View key={loc.id} style={s.listRow}>
                      <TextInput
                        style={[s.listInput]}
                        value={loc.displayName}
                        onChangeText={(t) => renameLocation(loc.id, t)}
                        placeholderTextColor={colors.mutedForeground}
                      />
                      <TouchableOpacity onPress={() => removeLocation(loc.id)} style={s.removeBtn}>
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {locations.length === 0 && (
                <Text style={s.emptyHint}>Hali joy qo'shilmagan</Text>
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={s.stepTitle}>Mahsulotlar</Text>
              <Text style={s.hint}>Taom, ichimlik va boshqa mahsulotlarni qo'shing</Text>
              <TextInput
                style={s.input}
                placeholder="Mahsulot nomi"
                placeholderTextColor={colors.mutedForeground}
                value={productName}
                onChangeText={setProductName}
              />
              <View style={s.row}>
                {UNIT_OPTIONS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[s.chip, productUnit === u && s.chipActive]}
                    onPress={() => setProductUnit(u)}
                  >
                    <Text style={[s.chipText, productUnit === u && s.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
                {PRICE_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[s.chip, productPriceStatus === p && s.chipActive]}
                    onPress={() => setProductPriceStatus(p)}
                  >
                    <Text style={[s.chipText, productPriceStatus === p && s.chipTextActive]}>
                      {p === 'pullik' ? 'Pullik' : 'Bonus'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {productPriceStatus === 'pullik' && (
                <TextInput
                  style={s.input}
                  placeholder="Narx (so'm)"
                  placeholderTextColor={colors.mutedForeground}
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="numeric"
                />
              )}
              <TextInput
                style={s.input}
                placeholder="Turlar (vergul bilan: Katta, Kichik)"
                placeholderTextColor={colors.mutedForeground}
                value={productVariants}
                onChangeText={setProductVariants}
              />
              <TouchableOpacity style={s.addBtn} onPress={addProduct}>
                <Feather name="plus" size={16} color={colors.primaryForeground} />
                <Text style={s.addBtnText}>Mahsulot qo'shish</Text>
              </TouchableOpacity>

              {templates.length > 0 && (
                <View style={s.listCard}>
                  {templates.map((t) => (
                    <View key={t.id} style={s.listRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.listItemName}>{t.name}</Text>
                        <Text style={s.listItemSub}>
                          {t.unit} · {t.priceStatus === 'bonus' ? 'Bepul' : t.basePrice.toLocaleString() + " so'm"}
                          {t.variants.length > 0 ? ` · ${t.variants.join(', ')}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setTemplates((p) => p.filter((x) => x.id !== t.id))}>
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {templates.length === 0 && (
                <Text style={s.emptyHint}>Hali mahsulot qo'shilmagan</Text>
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={s.stepTitle}>Xizmat narxi</Text>
              <Text style={s.hint}>Har bir kishi uchun xizmat (salfetka va boshqalar) narxini kiriting</Text>
              <TextInput
                style={s.input}
                placeholder="1 kishi uchun narx (so'm)"
                placeholderTextColor={colors.mutedForeground}
                value={servicePrice}
                onChangeText={setServicePrice}
                keyboardType="numeric"
                autoFocus
              />
              <View style={s.infoCard}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={s.infoText}>
                  Xizmat = Kishi soni × {servicePrice || '?'} so'm
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Feather name="arrow-left" size={18} color={colors.primary} />
            <Text style={s.backBtnText}>Orqaga</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.nextBtn} onPress={nextStep}>
          <Text style={s.nextBtnText}>
            {step === STEPS.length - 1 ? 'Boshlash' : 'Keyingi'}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 20 },
    stepsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepDot: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    stepDotActive: { backgroundColor: colors.primary },
    stepNum: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    stepLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, textAlign: 'center' },
    body: { flex: 1, paddingHorizontal: 24 },
    stepTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 6 },
    hint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 16 },
    input: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      marginBottom: 12,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    chipTextActive: { color: '#fff' },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.primary,
      borderRadius: colors.radius, paddingVertical: 12, marginBottom: 16,
    },
    addBtnText: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    listCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    listInput: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    removeBtn: { padding: 4 },
    listItemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    listItemSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 },
    emptyHint: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12 },
    infoCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.secondary, borderRadius: colors.radius,
      padding: 14, marginTop: 4,
    },
    infoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground },
    footer: {
      flexDirection: 'row', paddingHorizontal: 24,
      paddingTop: 16, gap: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 20, paddingVertical: 14,
      borderRadius: colors.radius, borderWidth: 1, borderColor: colors.primary,
    },
    backBtnText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
    nextBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.primary,
      borderRadius: colors.radius, paddingVertical: 14,
    },
    nextBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  });
}
