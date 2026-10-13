import axios from 'axios';

console.log("🔥 API URL:", import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle expired sessions and temp access
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/logout')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          (import.meta.env.VITE_API_URL || '/api') + '/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken = data.token;
        localStorage.setItem('token', newToken);
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    // For refresh endpoint failures, allow AuthContext to handle failure gracefully without wiping token prematurely
    if (error.response && error.response.status === 401 && originalRequest.url.includes('/auth/refresh')) {
      // Handled by AuthContext session restoration flow
    }

    if (error.response && error.response.status === 403 && error.response.data?.message === "Access denied") {
      const isPrincipalRoute = window.location.pathname.startsWith('/principal');
      if (isPrincipalRoute) {
        window.location.href = '/teacher/dashboard?tempExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
