import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper around AsyncStorage for typed, convenient storage ops.
 * Replaces localStorage from the web.
 */
export const Storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('[Storage] set error:', e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage] remove error:', e);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage] setJSON error:', e);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    } catch (e) {
      console.error('[Storage] multiRemove error:', e);
    }
  },
};

// Keys used throughout the app
export const StorageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  PROFILE_ID: 'profileId',
  LOCAL_FAVORITES: 'localFavorites',
  WATCH_PROGRESS: (id: string) => `watch_progress_${id}`,
} as const;
