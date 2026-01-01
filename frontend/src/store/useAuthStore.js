import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      wallet: null,

      // Actions
      login: (userData, token) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
          error: null,
          wallet: userData.wallet || 500.0,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          wallet: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setWallet: (newBalance) => set({ wallet: newBalance }),

      setError: (error) => set({ error: error }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use local storage
      // Only store user, token, and auth status (don't store loading/error)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        wallet: state.wallet, 
      }),
    }
  )
);