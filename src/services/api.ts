import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sekawan-bf.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      // Let browser/axios set multipart boundary automatically.
      delete config.headers?.['Content-Type'];
      delete config.headers?.['content-type'];
    } else {
      config.headers = config.headers || {};
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.response.config?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      
      if (error.response.status === 401) {
        console.error('❌ Unauthorized - Check token validity');

        // Jika token tidak valid, paksa logout di sisi client
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Jika sedang di area admin, arahkan kembali ke halaman login admin
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
            window.location.replace('/admin/login');
          }
        }
      } else if (error.response.status === 404) {
        console.error('❌ Endpoint not found - Check API path');
      } else if (error.response.status === 500) {
        console.error('❌ Server error');
      }
    } else if (error.request) {
      console.error('[API Error] No response - Network issue:', error.message);
    } else {
      console.error('[API Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
