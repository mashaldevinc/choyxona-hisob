import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
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
import { LocationItem, TemplateItem } from '@/types';
import { generateId } from '@/utils/formatting';

type TabType = 'locations' | 'products' | 'service';

export default function TemplatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { locations, templates, profile, addLocation, updateLocation, removeLocation, addTemplate, updateTemplate, removeTemplate, updateProfile } = useApp();
  const [tab, setTab] = useState<TabType>('locations');

  // Location form
  const [showLocModal, setShowLocModal] = useState(false);
  const [locTypeName, setLocTypeName] = useState('');
  const [locCount, setLocCount] = useState('');
  const [editingLoc, setEditingLoc] = useState<LocationItem | null>(null);
  const [editLocName, setEditLocName] = useState('');

  // Product form
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<TemplateItem | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodUnit, setProdUnit] = useState<'dona' | 'kg' | 'gr'>('dona');
  const [prodPriceStatus, setProdPriceStatus] = useState<'pullik' | 'bonus'>('pullik');
  const [prodPrice, setProdPrice] = useState('');
  const [prodVariants, setProdVariants] = useState('');

  // Service
  const [servicePrice, setServicePrice] = useState(String(profile?.servicePrice ?? ''));

  function addLocations() {
    const name = locTypeName.trim();
    const count = parseInt(locCount, 10);
    if (!name || isNaN(count) || count <= 0) { Alert.alert('Xato', "Joy turi va sonini kiriting"); return; }
    const existing = locations.filter((l) => l.typeName === name).length;
    for (let i = 1; i <= count; i++) {
      addLocation({ id: generateId(), typeName: name, displayName: `${existing + i}-${name}`, autoIndex: existing + i, isActive: true, isBusy: false });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocTypeName(''); setLocCount(''); setShowLocModal(false);
  }

  function saveLocEdit() {
    if (!editingLoc || !editLocName.trim()) return;
    updateLocation({ ...editingLoc, displayName: editLocName.trim() });
    setEditingLoc(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function confirmRemoveLoc(id: string) {
    Alert.alert("O'chirish", "Joyni o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => removeLocation(id) },
    ]);
  }

  function openAddProd() {
    setEditingProd(null); setProdName(''); setProdUnit('dona'); setProdPriceStatus('pullik'); setProdPrice(''); setProdVariants('');
    setShowProdModal(true);
  }

  function openEditProd(t: TemplateItem) {
    setEditingProd(t); setProdName(t.name); setProdUnit(t.unit); setProdPriceStatus(t.priceStatus);
    setProdPrice(String(t.basePrice)); setProdVariants(t.variants.join(', '));
    setShowProdModal(true);
  }

  function saveProd() {
    if (!prodName.trim()) { Alert.alert('Xato', "Nom kiriting"); return; }
    if (prodPriceStatus === 'pullik' && (!prodPrice || isNaN(parseFloat(prodPrice)))) { Alert.alert('Xato', "Narx kiriting"); return; }
    const variants = prodVariants.split(',').map((v) => v.trim()).filter(Boolean);
    const item: TemplateItem = {
      id: editingProd?.id ?? generateId(),
      name: prodName.trim(),
      unit: prodUnit,
      priceStatus: prodPriceStatus,
      basePrice: prodPriceStatus === 'bonus' ? 0 : parseFloat(prodPrice),
      variants,
      isActive: true,
    };
    if (editingProd) updateTemplate(item); else addTemplate(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowProdModal(false);
  }

  function confirmRemoveProd(id: string) {
    Alert.alert("O'chirish", "Mahsulotni o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => removeTemplate(id) },
    ]);
  }

  function saveService() {
    const sp = parseFloat(servicePrice);
    if (isNaN(sp) || sp < 0) { Alert.alert('Xato', "Narx kiriting"); return; }
    if (profile) updateProfile({ ...profile, servicePrice: sp });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saqlandi', "Xizmat narxi yangilandi");
  }

  const TABS: { key: TabType; label: string }[] = [
    { key: 'locations', label: 'Joylar' },
    { key: 'products', label: 'Mahsulotlar' },
    { key: 'service', label: 'Xizmat' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, { borderColor: colors.border }, tab === t.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, { color: colors.mutedForeground }, tab === t.key && { color: '#fff' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'locations' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, margin: 16 }]} onPress={() => setShowLocModal(true)}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Yangi joy qo'shish</Text>
          </TouchableOpacity>
          <FlatList
            data={locations}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
            renderItem={({ item }) => (
              editingLoc?.id === item.id ? (
                <View style={[styles.editRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]} value={editLocName} onChangeText={setEditLocName} autoFocus />
                  <TouchableOpacity onPress={saveLocEdit} style={[styles.editSave, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingLoc(null)}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.locDot, { backgroundColor: item.isBusy ? colors.destructive : colors.success }]} />
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.displayName}</Text>
                  {item.isBusy && <Text style={[styles.busyTag, { color: colors.destructive }]}>Band</Text>}
                  <TouchableOpacity onPress={() => { setEditingLoc(item); setEditLocName(item.displayName); }} style={styles.iconBtn}>
                    <Feather name="edit-2" size={14} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmRemoveLoc(item.id)} style={styles.iconBtn}>
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              )
            )}
          />
        </View>
      )}

      {tab === 'products' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary, margin: 16 }]} onPress={openAddProd}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Yangi mahsulot</Text>
          </TouchableOpacity>
          <FlatList
            data={templates}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                    {item.unit} · {item.priceStatus === 'bonus' ? 'Bepul' : item.basePrice.toLocaleString() + " so'm"}
                    {item.variants.length > 0 ? ` · ${item.variants.join(', ')}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEditProd(item)} style={styles.iconBtn}>
                  <Feather name="edit-2" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemoveProd(item.id)} style={styles.iconBtn}>
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {tab === 'service' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Xizmat narxi</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Har bir kishi uchun xizmat (salfetka va boshqalar) narxi
          </Text>
          <TextInput
            style={[styles.bigInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={servicePrice}
            onChangeText={setServicePrice}
            keyboardType="numeric"
            placeholder="Narx (so'm)"
            placeholderTextColor={colors.mutedForeground}
          />
          <View style={[styles.previewCard, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.previewText, { color: colors.foreground }]}>
              6 kishi × {servicePrice || '?'} so'm = {servicePrice ? (6 * (parseFloat(servicePrice) || 0)).toLocaleString() + " so'm" : '?'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveService}>
            <Text style={styles.saveBtnText}>Saqlash</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Location add modal */}
      <Modal visible={showLocModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowLocModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Joy qo'shish</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Joy turi (Xona, Stol...)" placeholderTextColor={colors.mutedForeground} value={locTypeName} onChangeText={setLocTypeName} autoFocus />
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Soni" placeholderTextColor={colors.mutedForeground} value={locCount} onChangeText={setLocCount} keyboardType="numeric" />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={addLocations}>
            <Text style={styles.confirmText}>Qo'shish</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Product modal */}
      <Modal visible={showProdModal} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setShowProdModal(false)} />
        <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editingProd ? "Tahrirlash" : "Yangi mahsulot"}</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Nomi" placeholderTextColor={colors.mutedForeground} value={prodName} onChangeText={setProdName} />
          <View style={styles.chipRow}>
            {(['dona', 'kg', 'gr'] as const).map((u) => (
              <TouchableOpacity key={u} style={[styles.chip, { borderColor: colors.border }, prodUnit === u && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setProdUnit(u)}>
                <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13 }, prodUnit === u && { color: '#fff' }]}>{u}</Text>
              </TouchableOpacity>
            ))}
            {(['pullik', 'bonus'] as const).map((p) => (
              <TouchableOpacity key={p} style={[styles.chip, { borderColor: colors.border }, prodPriceStatus === p && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setProdPriceStatus(p)}>
                <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13 }, prodPriceStatus === p && { color: '#fff' }]}>{p === 'pullik' ? 'Pullik' : 'Bonus'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {prodPriceStatus === 'pullik' && <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Narx (so'm)" placeholderTextColor={colors.mutedForeground} value={prodPrice} onChangeText={setProdPrice} keyboardType="numeric" />}
          <TextInput style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} placeholder="Turlar (vergul bilan)" placeholderTextColor={colors.mutedForeground} value={prodVariants} onChangeText={setProdVariants} />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={saveProd}>
            <Text style={styles.confirmText}>Saqlash</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  locDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  busyTag: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  iconBtn: { padding: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  editInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', borderBottomWidth: 1, paddingVertical: 4 },
  editSave: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontFamily: 'Inter_700Bold' },
  previewCard: { borderRadius: 12, padding: 14 },
  previewText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  backdrop: { flex: 1 },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  confirmText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
