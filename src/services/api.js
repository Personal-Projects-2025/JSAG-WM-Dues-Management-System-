import axios from 'axios';
import { toast } from 'react-toastify';
import apiCache from '../utils/apiCache.js';

const SESSION_INVALID_ERRORS = new Set(['User not found', 'Tenant not found']);

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

// Handle auth, rate limit, and stale session (JWT vs DB mismatch)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const sec = retryAfter != null ? Number(retryAfter) : NaN;
      let retryHint = ' Please wait a few minutes before trying again.';
      if (!Number.isNaN(sec) && sec > 0) {
        retryHint =
          sec < 120
            ? ` Try again in about ${Math.ceil(sec)} seconds.`
            : ` Try again in about ${Math.ceil(sec / 60)} minute(s).`;
      }
      toast.warn((apiError || 'Too many requests.') + retryHint);
      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (
      status === 404 &&
      localStorage.getItem('token') &&
      apiError &&
      SESSION_INVALID_ERRORS.has(apiError)
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session=invalid';
      return Promise.reject(error);
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

