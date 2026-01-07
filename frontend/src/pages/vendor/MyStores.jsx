import React, { useEffect, useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { useAuthStore } from '../../store/useAuthStore';
import axios from '../../config/axiosConfig'; // Ensure you have your axios config
import { 
  SearchIcon, 
  ArrowBackIcon, 
} from '../../components/Icons';

import { StoreIconDisplay } from '../../components/StoreIcons';

const MyStores = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  // Local State
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Vendor's Stores on Mount
  useEffect(() => {
    const fetchMyStores = async () => {
      try {
        setIsLoading(true);
        // API Call to get stores owned by this vendor
        // Adjust endpoint based on your actual backend route
        const response = await axios.get(`/api/stores`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if(response.data.success) {
            setStores(response.data.stores);
        } else {
            // Fallback for demo if API isn't ready yet
            setStores([]); 
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
        // Mock data for display purposes if backend fails
        setStores([
            { id: 1, name: "The Ultimate Store", address: "Chennai, India", icon_id: "store_1" },
            { id: 2, name: "Campus Cafe", address: "IIITDM Kancheepuram", icon_id: "cafe_1" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user_id) {
        fetchMyStores();
    }
  }, [user, token]);

  // 2. Filter Logic
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="mb-5 hover:opacity-70 transition-opacity p-2 -ml-2 rounded-full hover:bg-gray-50"
          >
            <ArrowBackIcon className="text-gray-700" />
          </button>

          {/* Search Bar - Matching Home Page Styling */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search my stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
               <SearchIcon />
            </div>
          </div>

          {/* Title Row */}
          <div className="flex justify-between items-center pb-2 px-2">
            <h2 className="text-xl font-bold text-gray-900">
               My Stores
            </h2>
            <span className="text-sm text-gray-400 font-medium">
                {filteredStores.length} Found
            </span>
          </div>
        </div>

        {/* --- List Section (Gray Background #f8f9fd) --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center pt-10 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm">Loading stores...</p>
            </div>
          ) : filteredStores.length > 0 ? (
            filteredStores.map((store) => (
              <div 
                key={store.id} 
                // Navigate to Edit Items page passing the store details
                onClick={() => navigate('/vendor/edit-items', { 
                    state: { 
                        storeDetails: {
                            name: store.name,
                            address: store.address,
                            logoId: store.icon_id, // Make sure this matches backend column
                            storeId: store.id
                        },
                        initialItems: store.items || [] // Pass existing items if available 
                    } 
                })}
                className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
              >
                {/* Avatar Logic - Using the StoreIconDisplay helper */}
                <div className="mr-4 flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100 p-2">
                        <StoreIconDisplay 
                            iconId={store.icon_id} 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                </div>
                
                {/* Store Name & Address */}
                <div className="flex flex-col">
                  <span className="text-gray-900 font-bold text-base mb-0.5">{store.name}</span>
                  <span className="text-xs text-gray-500 font-medium line-clamp-1">{store.address || "No address provided"}</span>
                </div>

                {/* Arrow indicator */}
                <div className="ml-auto text-gray-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
              </div>
            ))
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
              <div className="opacity-30 mb-4 scale-150">
                  <StoreIconDisplay iconId="store_1" className="w-16 h-16 grayscale" />
              </div>
              <p className="text-base font-semibold text-gray-500">No stores found</p>
              <button 
                onClick={() => navigate('/vendor/add-store')}
                className="mt-4 text-blue-500 font-bold text-sm hover:underline"
              >
                + Create a new store
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyStores;