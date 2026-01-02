import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "../config/axiosConfig";

const useMerchantStore = create(
    persist(
        (set, get) => ({
            // State
            stores: [],
            searchQuery: "",
            loading: false,
            error: null,
            currentStore: null,

            // Actions
            setSearchQuery: (query) => set({ searchQuery: query }),

            // Search stores API call
            searchStores: async (query = "") => {
                set({ loading: true, error: null });
                try {
                    const response = await axios.get("/api/stores/search", {
                        params: { query },
                    });

                    if (response.data.success) {
                        set({ stores: response.data.stores, loading: false });
                    } else {
                        set({
                            error: "Failed to fetch stores",
                            loading: false,
                        });
                    }
                } catch (error) {
                    console.error("Error searching stores:", error);
                    set({
                        error:
                            error.response?.data?.message ||
                            "Error searching stores",
                        loading: false,
                        stores: [],
                    });
                }
            },

            // Fetch store details with items
            fetchStoreDetails: async (storeId) => {
                set({ loading: true, error: null });
                try {
                    const response = await axios.get(`/api/stores/${storeId}`);

                    if (response.data.success) {
                        set({
                            currentStore: response.data.store,
                            loading: false,
                        });
                        return response.data.store;
                    } else {
                        set({
                            error: "Failed to fetch store details",
                            loading: false,
                        });
                        return null;
                    }
                } catch (error) {
                    console.error("Error fetching store details:", error);
                    set({
                        error:
                            error.response?.data?.message ||
                            "Error fetching store details",
                        loading: false,
                        currentStore: null,
                    });
                    return null;
                }
            },

            // Clear current store
            clearCurrentStore: () => set({ currentStore: null }),
        }),
        {
            name: "merchant-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useMerchantStore;
