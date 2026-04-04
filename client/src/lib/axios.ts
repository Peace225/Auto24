import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter le token Supabase si nécessaire
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token'); // Exemple
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});