import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useMerchantStore = create(
  persist(
    (set) => ({
      // 1. Initial Dummy Data (Matches your screenshot)
      stores: [
        {
          id: 'S1',
          name: 'The Ultimate Store',
          type: 'store',
          category: 'Grocery',
          avatar: null, // You can add image URLs here
        },
        {
          id: 'S2',
          name: 'Akshaya Mess',
          type: 'store',
          category: 'Food & Dining',
          avatar: null,
        },
        {
          id: 'S3',
          name: 'Akshaya Annexe Mess',
          type: 'store',
          category: 'Food & Dining',
          avatar: null,
        },
        {
          id: 'S4',
          name: 'Cafeteria IIITDM',
          type: 'store',
          category: 'Cafe',
          avatar: null,
        },
        {
          id: 'S5',
          name: 'Night Canteen Boys IIITDM',
          type: 'store',
          category: 'Canteen',
          avatar: null,
        },
        {
          id: 'S6',
          name: 'Night Canteen Girls',
          type: 'store',
          category: 'Canteen',
          avatar: null,
        },
      ],
      searchQuery: '',

      // 2. Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'merchant-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useMerchantStore;