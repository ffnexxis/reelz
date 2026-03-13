import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  getStaffPicks: () => api.get('/admin/staff-picks'),
  addStaffPick: (payload) => api.post('/admin/staff-picks', payload),
  removeStaffPick: (id) => api.delete(`/admin/staff-picks/${id}`),
  getTrending: () => api.get('/admin/trending'),
};

export const titlesApi = {
  search: (q, type = 'multi') => api.get('/titles/search', { params: { q, type } }),
};
