import React, { useEffect, useRef } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import useContactStore from '../store/useContactStore'; 
import { useAuthStore } from '../store/useAuthStore';
import { 
  SearchIcon, 
  ArrowBackIcon, 
  UserNameIcon, 
  SearchStoresIcon,
  FilterIcon, 
  DropdownIcon
} from '../components/Icons'; // Adjust path if needed

const PayPeoplePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const inputRef = useRef(null);
  
  // Get user info for fetching contacts
  const { user, token } = useAuthStore();
  
  // 1. Fetch state
  const { 
    recentContacts, 
    searchResults, 
    searchQuery, 
    setSearchQuery,
    fetchRecentContacts,
    isLoading,
    error
  } = useContactStore();

  // 2. Fetch recent contacts on mount
  useEffect(() => {
    if (user?.user_id) {
      fetchRecentContacts(user.user_id, token);
    }
  }, [user?.user_id, fetchRecentContacts, token]);

  // 3. Determine list
  const isSearching = searchQuery.length > 0;
  const displayList = isSearching ? searchResults : recentContacts;

  useEffect(() => {
    // If we navigated here with focusSearch: true, or just want it always focused
    if (location.state?.focusSearch) {
        // Small timeout ensures the element is fully mounted/transitioned
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }
  }, [location.state]);

  return (
    // Outer Container - Matching Home Page (#1581BF)
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      
      {/* Main Card - Matching Home Page Dimensions & Shape */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* --- Header Section (White) --- */}
        <div className="bg-white pt-8 pb-4 px-6 shadow-sm z-10">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="mb-5 hover:opacity-70 transition-opacity"
          >
            <ArrowBackIcon />
          </button>

          {/* Search Bar - Matching Home Page Styling */}
          <div className="relative w-full mb-6">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search peoples or stores"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value, token)}
              className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
               <SearchIcon />
            </div>
          </div>

          {/* Filter & Title Row */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
               {isSearching ? 'Search Results' : 'Recent Transactions'}
            </h2>
            
            <button className="flex items-center gap-2 text-gray-500 text-lg font-medium hover:text-gray-700">
              <FilterIcon />
              <span>Filter</span>
              <DropdownIcon />
            </button>
          </div>
        </div>

        {/* --- List Section (Gray Background #f8f9fd) --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center pt-10 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm">Loading...</p>
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center pt-10 text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          ) : displayList.length > 0 ? (
            displayList.map((contact) => (
              <div 
                key={contact.id} 
                onClick={() => navigate('/moneytransfer', { state: { contact: contact } })}
                className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Avatar Logic */}
                <div className="mr-4 flex-shrink-0">
                  {contact.type === 'person' && contact.avatar ? (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                    </div>
                  ) : contact.type === 'store' ? (
                    <div className="flex items-center justify-center">
                        <SearchStoresIcon />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                       <UserNameIcon />
                    </div>
                  )}
                </div>
                
                {/* Name & Tag */}
                <div className="flex flex-col">
                  <span className="text-gray-900 font-bold text-sm">{contact.name}</span>
                  {isSearching && recentContacts.find(r => r.id === contact.id) && (
                    <span className="text-[10px] text-gray-400 font-medium">Recent</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center pt-10 text-gray-400">
              <div className="opacity-50 mb-2">
                  <UserNameIcon />
              </div>
              <p className="text-sm">
                {isSearching ? "No users found in database" : "No recent transactions"}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PayPeoplePage;