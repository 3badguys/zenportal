import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers['X-Admin-Token'] = token;
  return config;
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // pass through cancelled requests so callers can distinguish abort from errors
    if (axios.isCancel(err)) return Promise.reject(err);
    const data = err.response?.data;
    const msg = data?.message || err.message || 'Network error';
    const e = new Error(msg) as Error & { refs?: string[] };
    // attach structured fields (e.g. refs for "file is referenced" errors)
    if (Array.isArray(data?.refs)) e.refs = data.refs;
    return Promise.reject(e);
  },
);

export default client;
