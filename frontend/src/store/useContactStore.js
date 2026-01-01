import { create } from "zustand";
import axios from "../config/axiosConfig";

const useContactStore = create((set, get) => ({
    // State
    recentContacts: [], // Recent contacts from backend
    searchResults: [], // Search results from backend
    searchQuery: "",
    isLoading: false,
    error: null,

    // Actions

    // Fetch recent contacts on mount or when needed
    fetchRecentContacts: async (user_id, token) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get("/api/users/recent-contacts", {
                params: { user_id },
				headers:{
					Authorization: `Bearer ${token}`,
				}
            });

            if (response.data.success) {
                set({
                    recentContacts: response.data.contacts,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Error fetching recent contacts:", err);
            set({
                error: err.response?.data?.message || "Failed to load contacts",
                isLoading: false,
                recentContacts: [],
            });
        }
    },

    // Search contacts as user types
    setSearchQuery: async (query, token) => {
        set({ searchQuery: query });

        // If query is empty, clear search results
        if (!query.trim()) {
            set({ searchResults: [], error: null });
            return;
        }

        // Don't search if less than 2 characters
        if (query.trim().length < 2) {
            set({ searchResults: [] });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const response = await axios.get("/api/users/search-contacts", {
                params: { q: query.trim() },
				headers:{
					Authorization: `Bearer ${token}`,
				}
            });

            if (response.data.success) {
                set({
                    searchResults: response.data.contacts,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Error searching contacts:", err);
            set({
                error: err.response?.data?.message || "Search failed",
                isLoading: false,
                searchResults: [],
            });
        }
    },

    // Clear all data
    clearContacts: () => {
        set({
            recentContacts: [],
            searchResults: [],
            searchQuery: "",
            error: null,
        });
    },
}));

export default useContactStore;
