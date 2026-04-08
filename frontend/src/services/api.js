import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/api`;
// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Inject the URL into the error message so the user can see exactly where it's failing
    if (error.response && error.response.status === 404) {
      const url = error.config?.url || error.config?.baseURL;
      if (error.response.data) {
        if (typeof error.response.data === 'object' && !error.response.data.message) {
            error.response.data.message = `404 from ${url} - ${JSON.stringify(error.response.data)}`;
        } else if (typeof error.response.data === 'string') {
            error.response.data = { message: `404 from ${url}: ${error.response.data.substring(0, 50)}` };
        } else {
            error.response.data.message = `404 Not Found from ${url}: ` + error.response.data.message;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
