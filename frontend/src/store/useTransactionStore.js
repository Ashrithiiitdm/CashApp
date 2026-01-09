import { create } from "zustand";
import axios from "../config/axiosConfig";

const useTransactionStore = create((set) => ({
    // State
    transactions: [],
    searchQuery: "",
    isLoading: false,
    error: null,

    // Fetch recent transactions OR search
    fetchTransactions: async (searchQuery = "", token) => {
        
        // Safety check
        if (!token) return; 

        set({ isLoading: true, error: null });
        try {
            const params = {};

            if (searchQuery && searchQuery.trim().length >= 2) {
                params.search = searchQuery.trim();
            }

            const response = await axios.get("/api/users/recent-transactions", {
                params,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const transformedTransactions =
                    response.data.recent_transactions.map((txn) => {
                        let name = txn.peer_name || txn.store_name || "Unknown";
                        let description = "Transaction";

                        // --- Description Logic ---
                        if (txn.transaction_type === 'WITHDRAW') {
                            name = "Withdraw";
                            description = "from wallet";
                        } else if (txn.transaction_type === 'ADD_MONEY') {
                            name = "Add Money";
                            description = "to wallet";
                        } else if (txn.store_name) {
                            if (txn.transaction_kind === 'credit') {
                                name = txn.peer_name || "Customer";
                                description = `Received at ${txn.store_name}`;
                            } else {
                                name = txn.store_name;
                                description = "Paid to store";
                            }
                        } else if (txn.transaction_kind === 'credit') {
                            description = "Received from";
                        } else {
                            description = "Paid to";
                        }

                        // console.log("Transforming transaction:", txn);

                        // --- Return Normalized Object ---
                        return {
                            id: txn.transaction_id,
                            name: name,
                            type: txn.transaction_kind,
                            amount: txn.amount_paise / 100,
                            date: txn.created_at,
                            description: description,
                            avatar: null,
                            isStore: !!txn.store_id,
                            store_logo: txn.store_logo || txn.icon_id || "store_1",
                            metadata: txn.metadata || { items: [] },
                            store_address: txn.address || txn.location || txn.location_text || "Location unavailable",
                            store_name: txn.store_name || name,

                            // Keep raw just in case
                            raw: txn,
                        };
                    });

                set({
                    transactions: transformedTransactions,
                    isLoading: false,
                });
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            set({
                error: err.response?.data?.message || "Failed to load transactions",
                isLoading: false,
                transactions: [],
            });
        }
    },

    setSearchQuery: async (query, token) => {
        set({ searchQuery: query });
        
        // Safety check
        if (token) {
            const store = useTransactionStore.getState();
            await store.fetchTransactions(query, token);
        }
    },

    resetSearchState: () => {
        set({ searchQuery: "" });
    },

    clearTransactions: () => {
        set({ transactions: [], searchQuery: "", error: null });
    },
}));

export default useTransactionStore;