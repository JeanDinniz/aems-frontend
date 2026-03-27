import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, AuthState } from '@/types/auth.types';

interface AuthStore extends AuthState {
    setAuth: (user: User, tokens: AuthTokens) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
    updateTokens: (tokens: AuthTokens) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: true,

            setAuth: (user, tokens) =>
                set({
                    user,
                    tokens,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            clearAuth: () =>
                set({
                    user: null,
                    tokens: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),

            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),

            updateTokens: (tokens) =>
                set({ tokens }),

            setLoading: (isLoading) =>
                set({ isLoading }),
        }),
        {
            name: 'aems-auth',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens ? { ...state.tokens, persistedAt: Date.now() } : null,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isLoading = false;

                    // Validate token expiration on rehydration
                    if (state.tokens && state.isAuthenticated) {
                        const { expiresIn, persistedAt } = state.tokens as AuthTokens & { persistedAt?: number };
                        if (persistedAt) {
                            const elapsedSeconds = (Date.now() - persistedAt) / 1000;
                            if (elapsedSeconds >= expiresIn) {
                                // Token expired — clear auth state
                                state.user = null;
                                state.tokens = null;
                                state.isAuthenticated = false;
                            }
                        }
                    }
                }
            },
        }
    )
);
