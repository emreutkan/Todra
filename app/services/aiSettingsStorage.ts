import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { SECURE_STORE_AI_API_KEY } from "../constants/aiSecureKeys";
import { STORAGE_KEYS } from "../constants/StorageKeys";
import {
  AiUserConfig,
  DEFAULT_AI_CONFIG,
} from "../types/ai";

export async function loadAiConfig(): Promise<AiUserConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.AI_CONFIG);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiUserConfig>;
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export async function saveAiConfig(config: AiUserConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(config));
}

export async function getAiApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_STORE_AI_API_KEY);
  } catch {
    return null;
  }
}

export async function setAiApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_AI_API_KEY, key.trim(), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearAiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_AI_API_KEY);
  } catch {
    /* noop */
  }
}
