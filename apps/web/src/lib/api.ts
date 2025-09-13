import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // In a real app, you would get the token from your auth store (e.g., Zustand, Redux)
    // For this example, we'll try to get it from localStorage.
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle things like 401 Unauthorized errors globally
    if (error.response?.status === 401) {
      // For example, redirect to login or refresh the token
      console.error("Unauthorized! Redirecting to login...");
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
