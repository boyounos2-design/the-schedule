import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach Firebase ID Token from auth.currentUser
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.error('Error getting ID token:', err);
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // In Firebase, token refresh usually happens automatically, 
      // but if we get a 401, the user profile might be missing or token revoked.
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
