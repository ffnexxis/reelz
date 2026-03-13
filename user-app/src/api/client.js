import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

// ── Titles ───────────────────────────────────────────────────────────────────
export const titlesApi = {
  search: (q, type = 'multi') => api.get('/titles/search', { params: { q, type } }),
  getPopular: (type = 'movie') => api.get('/titles/popular', { params: { type } }),
  getDetails: (tmdbId, type = 'movie') => api.get(`/titles/${tmdbId}`, { params: { type } }),
};

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const watchlistApi = {
  get: (status) => api.get('/watchlist', { params: status ? { status } : {} }),
  add: (payload) => api.post('/watchlist', payload),
  update: (id, data) => api.patch(`/watchlist/${id}`, data),
  remove: (id) => api.delete(`/watchlist/${id}`),
};

// ── Lists ─────────────────────────────────────────────────────────────────────
export const listsApi = {
  getAll: () => api.get('/lists'),
  getOne: (id) => api.get(`/lists/${id}`),
  create: (name, description) => api.post('/lists', { name, description }),
  delete: (id) => api.delete(`/lists/${id}`),
  addItem: (listId, payload) => api.post(`/lists/${listId}/items`, payload),
  removeItem: (listId, titleId) => api.delete(`/lists/${listId}/items/${titleId}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  getStaffPicks: () => api.get('/admin/staff-picks'),
  addStaffPick: (payload) => api.post('/admin/staff-picks', payload),
  removeStaffPick: (id) => api.delete(`/admin/staff-picks/${id}`),
  getTrending: () => api.get('/admin/trending'),
};
