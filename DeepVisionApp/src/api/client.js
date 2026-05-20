import axios from 'axios';
import { API_BASE } from '../config';
import { storage } from '../utils/storage';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
client.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return client(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = await storage.getRefreshToken();
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        await storage.saveTokens(data.access, refresh);
        client.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch (e) {
        processQueue(e, null);
        await storage.clearAll();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default client;
