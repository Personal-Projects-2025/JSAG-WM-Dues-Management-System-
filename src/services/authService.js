import api from './api.js';

export const authService = {
  login: async (usernameOrEmail, password) => {
    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    const payload = isEmail 
      ? { email: usernameOrEmail.toLowerCase(), password }
      : { username: usernameOrEmail, password };
    
    const response = await api.post('/auth/login', payload);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
      }
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  register: async (username, password, role) => {
    const response = await api.post('/auth/register', { username, password, role });
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getTenant: () => {
    const tenantStr = localStorage.getItem('tenant');
    return tenantStr ? JSON.parse(tenantStr) : null;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
      } else {
        localStorage.removeItem('tenant');
      }
    }
    return response.data;
  }
};

