import axios from 'axios';
import apiCache from '../utils/apiCache.js';

const API_URL = process.env.REACT_APP_API_URL || 'https://backendofduesaccountant.winswardtech.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Cached GET request helper
 * @param {string} url - API endpoint URL
 * @param {object} config - Axios config object
 * @param {number} ttl - Cache TTL in milliseconds (default: 5 minutes)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise} Axios response
 */
api.getCached = async (url, config = {}, ttl = null, useCache = true) => {
  const params = config.params || {};
  
  // Check cache first
  if (useCache) {
    const cached = apiCache.get(url, params);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
  }

  // Fetch from API
  try {
    const response = await api.get(url, config);
    
    // Cache successful responses
    if (useCache && response.status === 200) {
      apiCache.set(url, params, response.data, ttl);
    }
    
    return { ...response, fromCache: false };
  } catch (error) {
    throw error;
  }
};

/**
 * Clear cache for a specific endpoint
 */
api.clearCache = (url, params = {}) => {
  apiCache.clear(url, params);
};

/**
 * Clear all cache or cache matching a pattern
 */
api.clearCachePattern = (pattern) => {
  apiCache.clearPattern(pattern);
};

export default api;

