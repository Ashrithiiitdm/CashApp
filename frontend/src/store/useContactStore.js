import { create } from 'zustand';

// 1. Mock "Whole Database" (All users in the system)
const MOCK_DATABASE = [
  { id: 1, name: 'Ashirth', type: 'person', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'U-store', type: 'store', avatar: null },
  { id: 3, name: 'John Doe', type: 'person', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Mega Mart', type: 'store', avatar: null },
  { id: 5, name: 'Alice Smith', type: 'person', avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: 6, name: 'Bob Wilson', type: 'person', avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: 7, name: 'Tech World', type: 'store', avatar: null },
  { id: 8, name: 'Sarah James', type: 'person', avatar: 'https://i.pravatar.cc/150?u=8' },
];

// 2. Mock "Recent Transactions" (Subset of users)
const RECENT_TRANSACTIONS = [
  MOCK_DATABASE[0], // Ashirth
  MOCK_DATABASE[1], // U-store
];

const useContactStore = create((set, get) => ({
  // State
  recentContacts: RECENT_TRANSACTIONS, // Initial view
  searchResults: [],                   // Results when searching
  searchQuery: '',

  // Actions
  setSearchQuery: (query) => {
    set({ searchQuery: query });

    // SIMULATE DATABASE SEARCH
    // If query is empty, clear results (we will fall back to recentContacts in UI)
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    // Filter against the WHOLE MOCK_DATABASE
    const results = MOCK_DATABASE.filter((contact) =>
      contact.name.toLowerCase().includes(query.toLowerCase())
    );
    
    set({ searchResults: results });
  },
}));

export default useContactStore;