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
      wallet: 0,

      // Actions
      login: (userData, token) => {
        console.log("Login Action: Setting wallet to:", userData.balance || userData.wallet_balance);
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
          error: null,
          // Handle both 'balance' (Rupees) and 'wallet_balance' (Paise) cases safely
          wallet: userData.balance 
            ? Number(userData.balance) 
            : (userData.wallet_balance ? userData.wallet_balance / 100 : 0),
        });
      },

      logout: () => {
        console.log("Logout Action: Clearing data");
        // Optional: Force clear storage on logout to prevent stale data issues
        localStorage.removeItem('auth-storage'); 
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          wallet: 0,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setBalance: (newBalance) => {
        console.log("💰 setBalance Action Triggered. New Balance:", newBalance);
        set((state) => ({
          wallet: newBalance,
          // Keep user object in sync too so it doesn't revert on page reload
          user: state.user ? { ...state.user, balance: newBalance } : state.user
        }));
      },

      setError: (error) => set({ error: error }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), 
      
      // ✅ ADDED: Versioning
      // If you change your state structure in the future, bump this number.
      // This forces the app to discard old local storage data and start fresh.
      version: 1, 

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