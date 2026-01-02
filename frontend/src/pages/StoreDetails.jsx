import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useCartStore from "../store/useCartStore";
import useMerchantStore from "../store/useMerchantStore";
import {
    ArrowBackIcon,
    SearchIcon,
    SearchStoresIcon,
    ShoppingCartIcon,
} from "../components/Icons";

const StoreDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const storeId = location.state?.storeId;

    const { fetchStoreDetails, currentStore, loading } = useMerchantStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Fetch store details on mount
    useEffect(() => {
        if (storeId) {
            fetchStoreDetails(storeId);
        }
    }, [storeId]);

    // Auto-expand first category when items load
    useEffect(() => {
        if (
            currentStore?.items &&
            currentStore.items.length > 0 &&
            !expandedCategory
        ) {
            const categories = Object.keys(itemsByCategory);
            if (categories.length > 0) {
                setExpandedCategory(categories[0]);
            }
        }
    }, [currentStore]);

    const {
        cart,
        addItem,
        removeItem,
        getItemQty,
        getCartTotal,
        getCartCount,
    } = useCartStore();

    const totalAmount = getCartTotal();
    const totalItems = getCartCount();

    // Group items by category
    const itemsByCategory = useMemo(() => {
        if (!currentStore?.items) return {};

        const grouped = {};
        currentStore.items.forEach((item) => {
            if (item.categories && Array.isArray(item.categories)) {
                item.categories.forEach((category) => {
                    if (!grouped[category]) {
                        grouped[category] = [];
                    }
                    grouped[category].push(item);
                });
            } else {
                // Default category if none specified
                if (!grouped["Other"]) {
                    grouped["Other"] = [];
                }
                grouped["Other"].push(item);
            }
        });
        return grouped;
    }, [currentStore]);

    // Filter items based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return itemsByCategory;

        const filtered = {};
        Object.keys(itemsByCategory).forEach((category) => {
            const filteredItems = itemsByCategory[category].filter((item) =>
                item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filteredItems.length > 0) {
                filtered[category] = filteredItems;
            }
        });
        return filtered;
    }, [itemsByCategory, searchQuery]);

    const handleProceedToPay = () => {
        setIsCartOpen(false);
        navigate("/moneytransfer", {
            state: {
                contact: {
                    name: currentStore?.display_name,
                    store_id: currentStore?.store_id,
                    type: "store",
                },
                prefilledAmount: totalAmount,
                isPaymentFlow: true,
                cartItems: cart, // Pass cart items for metadata
            },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-blue-300 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!currentStore) {
        return (
            <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl text-center">
                    <p className="text-gray-700 mb-4">Store not found</p>
                    <button
                        onClick={() => navigate("/search-stores")}
                        className="bg-blue-500 text-white px-6 py-2 rounded-full"
                    >
                        Back to Stores
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            {/* 1. Main Card Container 
         - 'relative': Allows us to position the button absolutely inside this box.
         - 'overflow-hidden': Ensures nothing spills out of the rounded corners.
         - 'flex flex-col': Stacks Header -> List -> Button vertically.
      */}
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
                {/* --- Header (Static - Does not scroll) --- */}
                <div className="bg-[#f8f9fd] pt-8 pb-4 px-6 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 hover:opacity-70"
                    >
                        <ArrowBackIcon className="w-6 h-6 text-gray-700" />
                    </button>

                    <div className="flex flex-col items-center mb-6">
                        <SearchStoresIcon className="w-12 h-12 text-gray-800 mb-2" />
                        <h2 className="text-xl font-bold text-gray-900">
                            {currentStore.display_name}
                        </h2>
                        {currentStore.location_text && (
                            <p className="text-sm text-gray-500 mt-1">
                                {currentStore.location_text}
                            </p>
                        )}
                    </div>

                    <div className="relative w-full mb-4">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search items"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-600 text-sm"
                        />
                    </div>
                </div>

                {/* 2. Scrollable List */}
                <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-3">
                    {Object.keys(filteredCategories).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <p className="text-gray-500 text-center">
                                No items found
                            </p>
                        </div>
                    ) : (
                        Object.entries(filteredCategories).map(
                            ([categoryName, items]) => (
                                <div
                                    key={categoryName}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedCategory(
                                                expandedCategory ===
                                                    categoryName
                                                    ? null
                                                    : categoryName
                                            )
                                        }
                                        className="w-full flex justify-between items-center p-4 bg-white"
                                    >
                                        <span className="font-semibold text-gray-800">
                                            {categoryName}
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === categoryName ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {expandedCategory === categoryName && (
                                        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                                            {items.map((item) => {
                                                const itemId = item.item_id;
                                                const qty = getItemQty(itemId);
                                                return (
                                                    <div
                                                        key={itemId}
                                                        className="border border-gray-100 rounded-xl p-3 flex flex-col justify-between shadow-sm relative min-h-[110px]"
                                                    >
                                                        <div>
                                                            <h4 className="text-[13px] font-medium text-gray-700 leading-tight mb-1">
                                                                {item.item_name}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-400 block mb-2">
                                                                {item.unit}
                                                            </span>
                                                            {item.quantity !==
                                                                null && (
                                                                <span className="text-[9px] text-gray-500">
                                                                    Stock:{" "}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-between items-end mt-auto">
                                                            <span className="text-sm font-bold text-gray-900">
                                                                ₹
                                                                {(
                                                                    item.price_per_unit_paise /
                                                                    100
                                                                ).toFixed(2)}
                                                            </span>

                                                            {qty === 0 ? (
                                                                <button
                                                                    onClick={() =>
                                                                        addItem(
                                                                            {
                                                                                id: itemId,
                                                                                name: item.item_name,
                                                                                price:
                                                                                    item.price_per_unit_paise /
                                                                                    100,
                                                                                unit: item.unit,
                                                                            }
                                                                        )
                                                                    }
                                                                    className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-md hover:bg-green-700 active:scale-95"
                                                                >
                                                                    Add
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center border border-green-500 rounded-md overflow-hidden bg-white">
                                                                    <button
                                                                        onClick={() =>
                                                                            removeItem(
                                                                                itemId
                                                                            )
                                                                        }
                                                                        className="px-2 py-0.5 text-green-600 hover:bg-green-50 text-xs font-bold"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="text-[10px] font-bold text-green-700 px-1">
                                                                        {qty}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            addItem(
                                                                                {
                                                                                    id: itemId,
                                                                                    name: item.item_name,
                                                                                    price:
                                                                                        item.price_per_unit_paise /
                                                                                        100,
                                                                                    unit: item.unit,
                                                                                }
                                                                            )
                                                                        }
                                                                        className="px-2 py-0.5 text-green-600 hover:bg-green-50 text-xs font-bold"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        )
                    )}
                </div>

                {/* 3. Fixed Floating "View Cart" Button 
            - 'absolute': Removes it from the flow and floats it on top.
            - 'bottom-6': Pins it to the bottom of the card.
            - 'z-20': Ensures it sits on top of the scrolling list.
        */}
                {totalItems > 0 && !isCartOpen && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 z-20">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-[#4ADE80] bg-gradient-to-r from-green-500 to-green-400 text-white p-3 rounded-full shadow-xl flex items-center gap-6 justify-between px-6 hover:shadow-2xl transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingCartIcon className="w-5 h-5 text-white" />
                                <span className="font-bold text-sm bg-white/20 px-2 py-0.5 rounded-full">
                                    {totalItems}
                                </span>
                            </div>
                            <span className="font-bold text-lg">View Cart</span>
                            <span className="text-sm font-medium opacity-90">
                                {totalItems} items
                            </span>
                        </button>
                    </div>
                )}

                {isCartOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <div className="bg-white w-10/12 rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                <h3 className="w-[55%] font-bold text-lg text-gray-800">
                                    Item List
                                </h3>
                                <span className="w-[10%] text-xs font-semibold text-gray-500">
                                    Qt.
                                </span>
                                <span className="w-[15%] text-xs font-semibold text-gray-500">
                                    Price
                                </span>
                            </div>

                            <div className="max-h-[200px] overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span className="text-gray-700 font-medium truncate w-[55%]">
                                            {item.name}
                                        </span>
                                        {/* Quantity controls inside Cart Modal list as well, for consistency */}
                                        <div className="flex items-center gap-1 w-[25%] justify-center border border-green-500 rounded px-1">
                                            <button
                                                onClick={() =>
                                                    removeItem(item.id)
                                                }
                                                className="text-green-600 font-bold px-1"
                                            >
                                                -
                                            </button>
                                            <span className="text-xs font-bold text-gray-800 px-1">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => addItem(item)}
                                                className="text-green-600 font-bold px-1"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-gray-900 font-bold w-[15%] text-right">
                                            ₹{item.price * item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-200 pt-3 mb-6">
                                <span className="text-gray-600 font-medium">
                                    Total :
                                </span>
                                <span className="text-xl font-bold text-gray-900">
                                    ₹{totalAmount}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="flex-1 bg-[#1581BF] text-white py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#106ba1]"
                                >
                                    + Add items
                                </button>
                                <button
                                    onClick={handleProceedToPay}
                                    className="flex-1 bg-[#22c55e] text-white py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#16a34a] flex items-center justify-center gap-1"
                                >
                                    <span>₹ Pay</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreDetails;
