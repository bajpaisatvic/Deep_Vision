import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'dv_access',
  REFRESH_TOKEN: 'dv_refresh',
  USER: 'dv_user',
};

export const storage = {
  async saveTokens(access, refresh) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async saveUser(user) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
  },
};
