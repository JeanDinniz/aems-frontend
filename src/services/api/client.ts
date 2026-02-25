import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - adiciona token
apiClient.interceptors.request.use(
    (config) => {
        const { tokens } = useAuthStore.getState();
        if (tokens?.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - refresh token automático
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Enfileirar requisições enquanto refresh acontece
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const { tokens, setAuth, clearAuth } = useAuthStore.getState();

            if (!tokens?.refreshToken) {
                clearAuth();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const refreshResponse = await axios.post(
                    `${apiClient.defaults.baseURL}/auth/refresh`,
                    { refresh_token: tokens.refreshToken }
                );

                // Backend returns: { access_token, refresh_token, expires_in, must_change_password }
                const { access_token, refresh_token, expires_in, must_change_password } = refreshResponse.data;

                // Fetch user data with new token
                const userResponse = await axios.get(
                    `${apiClient.defaults.baseURL}/auth/me`,
                    { headers: { Authorization: `Bearer ${access_token}` } }
                );

                const user = {
                    id: userResponse.data.id,
                    full_name: userResponse.data.full_name,
                    email: userResponse.data.email,
                    role: userResponse.data.role,
                    is_active: userResponse.data.is_active,
                    must_change_password: must_change_password,
                    store_id: userResponse.data.store_id,
                    supervised_store_ids: userResponse.data.supervised_store_ids || [],
                    last_login: userResponse.data.last_login,
                    created_at: userResponse.data.created_at,
                    updated_at: userResponse.data.updated_at,
                };

                const newTokens = {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresIn: expires_in,
                };

                setAuth(user, newTokens);

                processQueue(null, newTokens.accessToken);

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
