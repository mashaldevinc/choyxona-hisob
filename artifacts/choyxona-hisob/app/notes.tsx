import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert, FlatList, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { generateId, formatDateTime, todayStr } from '@/utils/formatting';

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, addNote, removeNote } = useApp();
  const [text, setText] = useState('');

  function handleAdd() {
    if (!text.trim()) return;
    addNote({ id: generateId(), text: text.trim(), createdAt: todayStr() });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Yangi qayd yozing..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleAdd}
          disabled={!text.trim()}
        >
          <Feather name="check" size={18} color={text.trim() ? '#fff' : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="edit-3" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Hali qaydlar yo'q</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.foreground }]}>{item.text}</Text>
            <View style={styles.noteFooter}>
              <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>{formatDateTime(item.createdAt)}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert("O'chirish", "Qaydni o'chirmoqchimisiz?", [
                  { text: 'Bekor', style: 'cancel' },
                  { text: "O'chirish", style: 'destructive', onPress: () => removeNote(item.id) },
                ])}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    margin: 16, borderRadius: 16, borderWidth: 1, padding: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  noteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
