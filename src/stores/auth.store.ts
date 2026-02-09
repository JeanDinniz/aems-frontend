import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Após carregar do localStorage, setar isLoading para false
                if (state) {
                    state.isLoading = false;
                }
            },
        }
    )
);
