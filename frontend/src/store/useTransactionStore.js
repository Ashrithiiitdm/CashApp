import { create } from "zustand";
import axios from "../config/axiosConfig";


const useTransactionStore = create((set) => ({
    // State
    transactions: [],
    searchQuery: "",
    isLoading: false,
    error: null,

    

    // Fetch recent transactions OR search (unified approach like contacts)
    fetchTransactions: async (searchQuery = "", token) => {
        set({ isLoading: true, error: null });
        try {
            const params = {};

            // If search query exists, pass it to backend
            if (searchQuery && searchQuery.trim().length >= 2) {
                params.search = searchQuery.trim();
            }

            const response = await axios.get("/api/users/recent-transactions", {
                params,
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (response.data.success) {
                // Transform backend data to frontend format
                const transformedTransactions =
                    response.data.recent_transactions.map((txn) => ({
                        id: txn.transaction_id,
                        name: txn.peer_name || txn.store_name || "Unknown",
                        type: txn.transaction_kind,
                        amount: txn.amount_paise / 100,
                        date: txn.created_at,
                        description: txn.store_name
                            ? "from wallet"
                            : "to wallet",
                        avatar: null,
                        isStore: !!txn.store_id,
                        raw: txn,
                    }));

                set({
                    transactions: transformedTransactions,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            set({
                error:
                    err.response?.data?.message ||
                    "Failed to load transactions",
                isLoading: false,
                transactions: [],
            });
        }
    },

    // Update search query and trigger backend search
    setSearchQuery: async (query, token) => {
        set({ searchQuery: query });

        // If empty or < 2 chars, fetch recent (no search param)
        // If >= 2 chars, fetch with search param
        const store = useTransactionStore.getState();
        await store.fetchTransactions(query, token);
    },

    // Clear transactions
    clearTransactions: () => {
        set({ transactions: [], searchQuery: "", error: null });
    },
}));

export default useTransactionStore;
