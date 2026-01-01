import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTransactionStore from '../store/useTransactionStore';
import { 
  ArrowBackIcon, 
  SearchIcon, 
  FilterIcon, 
  DropdownIcon,
  SearchStoresIcon,
  UserNameIcon,
  ReceiptIcon 
} from '../components/Icons'; 

// --- Helper: Format Date Header ---
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Check if it matches Today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  // Check if it matches Yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  // Otherwise return formatted date (e.g., "January 2, 2026")
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const RecentTransactions = () => {
  const navigate = useNavigate();
  const { transactions, searchQuery, setSearchQuery } = useTransactionStore();

  // --- Logic: Filter, Sort, and Group ---
  const groupedTransactions = useMemo(() => {
    // 1. Filter first
    const filtered = transactions.filter((txn) =>
      txn.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort by Date (Newest First)
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Group by Date Key
    const groups = sorted.reduce((acc, txn) => {
      // Normalize date string for grouping key
      const dateKey = new Date(txn.date).toDateString(); 
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(txn);
      return acc;
    }, {});

    return groups;
  }, [transactions, searchQuery]);

  const hasResults = Object.keys(groupedTransactions).length > 0;

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* --- Header Section --- */}
        <div className="bg-white pt-8 pb-4 px-6 shadow-sm z-10 rounded-b-3xl">
          <button 
            onClick={() => navigate('/home')} 
            className="mb-5 hover:opacity-70 transition-opacity"
          >
            <ArrowBackIcon className="w-6 h-6 text-gray-700" />
          </button>

          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search transactions ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          
          {hasResults ? (
            // Iterate over the Groups (Dates)
            Object.entries(groupedTransactions).map(([dateKey, txns]) => (
              <div key={dateKey}>
                
                {/* Dynamic Date Header */}
                <h3 className="text-gray-500 text-xs font-semibold mb-3 ml-1 uppercase tracking-wide">
                  {formatDateHeader(dateKey)}
                </h3>

                {/* List of Transactions for this Date */}
                <div className="space-y-3">
                  {txns.map((txn) => (
                    <div 
                      key={txn.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                              {txn.isStore ? (
                                   <SearchStoresIcon className="w-6 h-6 text-gray-700" />
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

                      {/* Right: Amount */}
                      <div className="flex items-center gap-2">
                          {txn.type === 'debit' && (
                              <ReceiptIcon className="w-5 h-5 text-blue-400" />
                          )}
                          <span className={`text-sm font-bold ${txn.type === 'credit' ? 'text-[#36a736]' : 'text-gray-900'}`}>
                              {txn.type === 'credit' ? '+' : ''} ₹{Number(txn.amount).toFixed(2)}
                          </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // --- Empty State ---
            <div className="flex flex-col items-center justify-center h-full py-20">
               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                   <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                   </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">No results were found</h3>
               <p className="text-gray-400 text-center text-xs max-w-[250px] leading-relaxed">
                   We couldn't find any transaction related to your search. Please try another search term.
               </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecentTransactions;