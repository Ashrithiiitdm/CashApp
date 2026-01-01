import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useTransactionStore = create(
  persist(
    (set) => ({
      // 1. Initial Dummy Data (Matches your screenshot)
      transactions: [
        {
          id: 'TXN1',
          name: 'Ashirth',
          type: 'credit', // Money coming IN (+)
          amount: 500.00,
          date: 'December 31, 2025',
          description: 'to wallet',
          avatar: 'https://i.pravatar.cc/150?u=ashirth', 
          isStore: false,
        },
        {
          id: 'TXN2',
          name: 'U-store',
          type: 'debit', // Money going OUT
          amount: 2500.00,
          date: 'January 1, 2026',
          description: 'from wallet',
          avatar: null, 
          isStore: true,
        },
      ],
      searchQuery: '',

      // 2. Actions
      addTransaction: (txn) => set((state) => ({ 
        transactions: [txn, ...state.transactions] 
      })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTransactionStore;