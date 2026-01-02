import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useMerchantStore from "../store/useMerchantStore";
import {
    ArrowBackIcon,
    SearchIcon,
    FilterIcon,
    DropdownIcon,
    SearchStoresIcon,
} from "../components/Icons";

const SearchStores = () => {
    const navigate = useNavigate();

    const { stores, searchQuery, setSearchQuery, searchStores, loading } =
        useMerchantStore();

    // Fetch all stores on mount
    useEffect(() => {
        searchStores("");
    }, []);

    console.log("Stores", stores);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchStores(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        // Outer Container (#1581BF)
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            {/* Main Card */}
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
                {/* --- Header Section (White) --- */}
                <div className="bg-white pt-8 pb-4 px-6 shadow-sm z-10 rounded-b-3xl">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/home")}
                        className="mb-5 hover:opacity-70 transition-opacity"
                    >
                        <ArrowBackIcon className="w-6 h-6 text-gray-700" />
                    </button>

                    {/* Search Bar */}
                    <div className="relative w-full mb-6">
                        <input
                            type="text"
                            placeholder="Search Stores"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Title & Filter Row */}
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold text-gray-900">
                            All Stores
                        </h2>

                        <button className="flex items-center gap-1 text-gray-500 text-sm font-medium hover:text-gray-700">
                            <FilterIcon className="w-4 h-4 text-blue-500" />
                            <span>Filter</span>
                            <DropdownIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* --- List Section --- */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 text-sm">
                                Loading stores...
                            </p>
                        </div>
                    ) : stores.length > 0 ? (
                        stores.map((store) => (
                            <div
                                key={store.store_id}
                                onClick={() =>
                                    navigate("/store-details", {
                                        state: { storeId: store.store_id },
                                    })
                                }
                                className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                {/* Avatar / Store Icon */}
                                <div className="mr-4 flex-shrink-0">
                                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                                        <SearchStoresIcon className="w-7 h-7 text-orange-500" />
                                    </div>
                                </div>

                                {/* Store Name */}
                                <div className="flex flex-col flex-1">
                                    <span className="text-gray-900 font-bold text-sm tracking-wide">
                                        {store.display_name}
                                    </span>
                                    {store.location_text && (
                                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {store.location_text}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        // --- Empty State ---
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <svg
                                    className="w-10 h-10 text-red-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                No stores found
                            </h3>
                            <p className="text-gray-400 text-center text-xs max-w-[250px] leading-relaxed">
                                We couldn't find any store matching your search.
                                Try searching for a different name.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchStores;
