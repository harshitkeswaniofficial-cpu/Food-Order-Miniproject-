/**
 * services/api.js
 * Centralized API client connecting frontend to the Express & PostgreSQL backend.
 * Automatically attaches Admin JWT Bearer token for protected administrative requests.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getAdminToken() {
  return localStorage.getItem('foodorder_admin_token') || '';
}

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem('foodorder_admin_token', token);
  } else {
    localStorage.removeItem('foodorder_admin_token');
  }
}

export function getStoredAdminUser() {
  try {
    const raw = localStorage.getItem('foodorder_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAdminUser(user) {
  if (user) {
    localStorage.setItem('foodorder_admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('foodorder_admin_user');
  }
}

export function clearAdminSession() {
  localStorage.removeItem('foodorder_admin_token');
  localStorage.removeItem('foodorder_admin_user');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Attach administrator token if present
  const token = getAdminToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If server reports unauthorized on an admin route, clear stale token
      if (response.status === 401 && endpoint.startsWith('/admin')) {
        clearAdminSession();
      }
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Health check
  getHealth: () => request('/health'),

  // Admin Authentication
  adminLogin: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getAdminMe: () => request('/auth/me'),

  adminLogout: () => request('/auth/logout', { method: 'POST' }),

  // Categories (Public)
  getCategories: () => request('/categories'),

  // Menu items (Public browse, Protected create/update/delete)
  getMenuItems: (category = 'all', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/menu${queryString}`);
  },

  getMenuItem: (id) => request(`/menu/${id}`),

  addMenuItem: (itemData) =>
    request('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    }),

  updateMenuItem: (id, itemData) =>
    request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    }),

  deleteMenuItem: (id) =>
    request(`/menu/${id}`, {
      method: 'DELETE'
    }),

  // Orders (Public place, Protected admin view/update)
  placeOrder: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),

  getAllOrders: () => request('/orders'),

  getOrderById: (id, phone = '') => {
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    return request(`/orders/${id}${query}`);
  },

  getCustomerOrders: (phone, verifyOrderId = null) => {
    let query = `/orders/customer/${encodeURIComponent(phone)}`;
    if (verifyOrderId) {
      query += `?orderId=${encodeURIComponent(verifyOrderId)}`;
    }
    return request(query);
  },

  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Admin Stats (Protected)
  getAdminStats: () => request('/admin/stats')
};
