import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTransactionStore from "../store/useTransactionStore";
import { useAuthStore } from "../store/useAuthStore";
import {
    ArrowBackIcon,
    SearchIcon,
    FilterIcon,
    DropdownIcon,
    UserNameIcon,
    ReceiptIcon, // ✅ Ensure this is imported
} from "../components/Icons";

import { StoreIconDisplay } from "../components/StoreIcons";
import ReceiptModal from '../components/ReceiptModal';

// ... (Keep formatDateHeader helper as is) ...
const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const RecentTransactions = () => {
    const navigate = useNavigate();
    const [selectedTxn, setSelectedTxn] = useState(null);

    const {
        transactions,
        searchQuery,
        setSearchQuery,
        fetchTransactions,
        isLoading,
        error,
    } = useTransactionStore();
    const { token } = useAuthStore();

    useEffect(() => {
        fetchTransactions("", token);
    }, []);

    const groupedTransactions = useMemo(() => {
        const sorted = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted.reduce((acc, txn) => {
            const dateKey = new Date(txn.date).toDateString();
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(txn);
            return acc;
        }, {});
    }, [transactions]);

    const hasResults = Object.keys(groupedTransactions).length > 0;

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
                {/* ... (Header Section stays the same) ... */}
                <div className="bg-white pt-8 pb-4 px-6 shadow-sm z-10 rounded-b-3xl">
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            navigate(-1);
                        }}
                        className="mb-5 hover:opacity-70 transition-opacity"
                    >
                        <ArrowBackIcon className="w-6 h-6 text-gray-700" />
                    </button>

                    <div className="relative w-full mb-6">
                        <input
                            type="text"
                            placeholder="Search transactions ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value, token)}
                            className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold text-gray-900">All Transactions</h2>
                        <button className="flex items-center gap-1 text-gray-500 text-sm font-medium hover:text-gray-700">
                            <FilterIcon className="w-4 h-4 text-blue-500" />
                            <span>Filter</span>
                            <DropdownIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* --- List Section --- */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-gray-400 text-sm">Loading transactions...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                {/* Error Icon SVG */}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading</h3>
                            <p className="text-gray-400 text-center text-xs max-w-[250px] leading-relaxed">{error}</p>
                        </div>
                    ) : hasResults ? (
                        Object.entries(groupedTransactions).map(([dateKey, txns]) => (
                            <div key={dateKey}>
                                <h3 className="text-gray-500 text-xs font-semibold mb-3 ml-1 uppercase tracking-wide">
                                    {formatDateHeader(dateKey)}
                                </h3>

                                <div className="space-y-3">
                                    {txns.map((txn) => (
                                        <div
                                            key={txn.id}
                                            // Clicking the row opens receipt if it's a store
                                            onClick={() => {
                                                if (txn.isStore) setSelectedTxn(txn);
                                            }}
                                            className={`flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-shadow 
                                                ${txn.isStore ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
                                        >
                                            {/* Left Side: Avatar & Info */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                                    {txn.isStore ? (
                                                        <div className="w-full h-full p-1.5 flex items-center justify-center bg-blue-50">
                                                            <StoreIconDisplay iconId={txn.store_logo} className="w-full h-full object-contain" />
                                                        </div>
                                                    ) : txn.avatar ? (
                                                        <img src={txn.avatar} alt={txn.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserNameIcon className="w-6 h-6 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold text-sm">{txn.name}</span>
                                                    <span className="text-[11px] text-gray-400">{txn.description}</span>
                                                </div>
                                            </div>

                                            {/* Right Side: Receipt Icon & Amount */}
                                            <div className="flex items-center gap-3">
                                                
                                                {/* ✅ 1. SHOW RECEIPT ICON ONLY FOR STORES */}
                                                {txn.isStore && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Don't trigger the row click twice
                                                            setSelectedTxn(txn);
                                                        }}
                                                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors group"
                                                        title="View Receipt"
                                                    >
                                                        {/* Icon is gray by default, blue on hover */}
                                                        <ReceiptIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                                    </button>
                                                )}

                                                <span className={`text-sm font-bold ${txn.type === "credit" ? "text-[#36a736]" : "text-gray-900"}`}>
                                                    {txn.type === "credit" ? "+" : ""} ₹{Number(txn.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            {/* Empty State */}
                             <h3 className="text-xl font-bold text-gray-900 mb-2">No results were found</h3>
                        </div>
                    )}
                </div>

                {/* Receipt Modal */}
                {selectedTxn && (
                    <ReceiptModal
                        transaction={selectedTxn}
                        onClose={() => setSelectedTxn(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default RecentTransactions;