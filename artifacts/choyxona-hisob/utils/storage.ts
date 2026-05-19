import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '@/types';

const STORAGE_KEY = 'choyxona_hisob_state';

export async function loadState(): Promise<Partial<AppState>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return {};
  }
}

export async function saveState(state: Partial<AppState>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silent
  }
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function clearSelected(keys: string[]): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const state = JSON.parse(raw) as Record<string, unknown>;
  for (const key of keys) {
    delete state[key];
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
