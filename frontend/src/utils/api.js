import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('civicvoice:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

// Fetch every issue from the backend by paging through all results.
// The server caps `limit` at 100, so a single page cannot return everything.
export async function fetchAllIssues(params = {}, pageSize = 100) {
  const all = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total) {
    const { data } = await api.get('/issues', {
      params: { ...params, page, limit: pageSize },
    });
    const items = data.issues || [];
    all.push(...items);
    total = typeof data.total === 'number' ? data.total : all.length;
    if (items.length === 0) break;
    page += 1;
  }
  return all;
}
