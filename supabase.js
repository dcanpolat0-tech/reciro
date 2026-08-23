import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const appExtra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
const supabaseUrl = appExtra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey =
  appExtra.supabasePublishableKey || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const MAX_SECURE_STORE_SIZE = 2000;

const LargeSecureStoreAdapter = {
  getItem: async (key) => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        let value = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) {
            value += chunk;
          }
        }
        return value;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore getItem error:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (typeof value !== 'string') {
        return;
      }
      if (value.length <= MAX_SECURE_STORE_SIZE) {
        const oldCountStr = await SecureStore.getItemAsync(`${key}_count`);
        if (oldCountStr) {
          const oldCount = parseInt(oldCountStr, 10);
          for (let i = 0; i < oldCount; i++) {
            await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
          }
          await SecureStore.deleteItemAsync(`${key}_count`);
        }
        await SecureStore.setItemAsync(key, value);
      } else {
        await SecureStore.deleteItemAsync(key);

        const chunks = Math.ceil(value.length / MAX_SECURE_STORE_SIZE);
        const oldCountStr = await SecureStore.getItemAsync(`${key}_count`);
        const oldCount = oldCountStr ? parseInt(oldCountStr, 10) : 0;

        for (let i = 0; i < chunks; i++) {
          const chunk = value.slice(i * MAX_SECURE_STORE_SIZE, (i + 1) * MAX_SECURE_STORE_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
        for (let i = chunks; i < oldCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.setItemAsync(`${key}_count`, chunks.toString());
      }
    } catch (e) {
      console.warn('SecureStore setItem error:', e);
    }
  },
  removeItem: async (key) => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore removeItem error:', e);
    }
  },
};

const sessionStorage = Platform.OS === 'web' ? AsyncStorage : LargeSecureStoreAdapter;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getSupabaseAccessToken() {
  if (!supabase) {
    return '';
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token || '';
}
