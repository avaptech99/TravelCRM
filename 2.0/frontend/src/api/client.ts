import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Track when the last real API call happened (used by smart idle-heartbeat)
export let lastApiCallTime = Date.now();

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        lastApiCallTime = Date.now();
        return response;
    },
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
