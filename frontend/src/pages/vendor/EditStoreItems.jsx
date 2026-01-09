import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from '../../config/axiosConfig';
import { useAuthStore } from '../../store/useAuthStore';
import useMerchantStore from '../../store/useMerchantStore'; 
import toast from 'react-hot-toast'; // ✅ Import toast
import {
    ArrowBackIcon,
    SearchIcon,
    AddIcon as PlusIconSmall,
    TrashIcon,
    DropdownIcon,
    EditIcon,
} from '../../components/Icons';
import { StoreIconDisplay } from '../../components/StoreIcons';

const EditStoreItems = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { storeDetails, initialItems } = location.state || {};
    const { token } = useAuthStore();

    // Get the fetch action and loading state from the store
    const { fetchStoreDetails, loading: storeLoading } = useMerchantStore();

    // Refs
    const fileInputRef = useRef(null);

    // State
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [openCategories, setOpenCategories] = useState({});
    const [editingCategory, setEditingCategory] = useState(null);
    const [tempCategoryName, setTempCategoryName] = useState("");

    // Loading states
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- INITIALIZATION LOGIC ---
    useEffect(() => {
        const initialize = async () => {
            // Priority 1: Use items passed via navigation
            if (initialItems && initialItems.length > 0) {
                setItems(initialItems);
                autoOpenCategories(initialItems);
                return;
            }

            // Priority 2: Fetch from Backend using Merchant Store
            const storeId = storeDetails?.storeId || storeDetails?.id || storeDetails?.store_id;
            
            if (storeId) {
                const fetchedStore = await fetchStoreDetails(storeId);

                if (fetchedStore && fetchedStore.items) {
                    const mappedItems = fetchedStore.items.map(dbItem => ({
                        id: dbItem.item_id, 
                        name: dbItem.item_name,
                        price: (dbItem.price_per_unit_paise / 100), 
                        quantity: dbItem.quantity || 0,
                        category: (dbItem.categories && dbItem.categories.length > 0) 
                                  ? dbItem.categories[0] 
                                  : "Uncategorized"
                    }));

                    setItems(mappedItems);
                    autoOpenCategories(mappedItems);
                }
            }
        };

        initialize();
    }, [initialItems, storeDetails]); 

    const autoOpenCategories = (itemList) => {
        const initialOpen = {};
        itemList.forEach(i => initialOpen[i.category] = true);
        setOpenCategories(initialOpen);
    };

    // --- ACTIONS ---

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const deleteItem = (id) => {
        if(window.confirm("Delete this item?")) {
            setItems(items.filter(i => i.id !== id));
            toast.success("Item deleted"); // ✅ Added toast confirmation
        }
    };

    const addItemToCategory = (categoryName) => {
        const newItem = { id: uuidv4(), name: "", price: "", quantity: 1, category: categoryName };
        setItems([...items, newItem]);
        setOpenCategories(prev => ({ ...prev, [categoryName]: true }));
    };

    const addNewCategory = () => {
        let newName = "New Category";
        let counter = 1;
        const existingCats = new Set(items.map(i => i.category));
        while (existingCats.has(newName)) {
            newName = `New Category ${counter++}`;
        }

        const newItem = { id: uuidv4(), name: "", price: "", quantity: 1, category: newName };
        setItems([...items, newItem]);
        setOpenCategories(prev => ({ ...prev, [newName]: true }));
        startEditingCategory(newName);
    };

    const toggleCategory = (cat) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const startEditingCategory = (currentName) => {
        setEditingCategory(currentName);
        setTempCategoryName(currentName);
    };

    const saveCategoryName = (oldName) => {
        const newName = tempCategoryName.trim();
        if (!newName) { 
            toast.error("Category name cannot be empty"); // ✅ Toast
            return; 
        }
        if (newName === oldName) { setEditingCategory(null); return; }

        setItems(prev => prev.map(item => item.category === oldName ? { ...item, category: newName } : item));
        setOpenCategories(prev => {
            const newState = { ...prev };
            newState[newName] = newState[oldName];
            delete newState[oldName];
            return newState;
        });
        setEditingCategory(null);
    };

    // ✅ IMAGE EXTRACTION LOGIC
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. File Size Check (1MB limit)
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB > 1) {
            // ✅ Toast
            toast.error(`File too large (${fileSizeInMB.toFixed(2)} MB). Max 1 MB allowed.`);
            e.target.value = ''; 
            return;
        }

        setIsScanning(true);
        const toastId = toast.loading("Analyzing image for items..."); // ✅ Loading Toast

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post(
                "/api/stores/extract-items",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                const extractedItems = response.data.items.map(item => ({
                    id: uuidv4(),
                    name: item.name || "Unknown Item",
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    category: item.category || "Extracted Items" 
                }));

                setItems(prev => [...prev, ...extractedItems]);

                setOpenCategories(prev => {
                    const newState = { ...prev };
                    extractedItems.forEach(item => newState[item.category] = true);
                    return newState;
                });

                console.log(`✅ Extracted & Appended ${extractedItems.length} items`);
                // ✅ Success Toast
                toast.success(`Found ${extractedItems.length} items!`, { id: toastId });
            } else {
                console.error("⚠️ Extraction failed:", response.data.message);
                // ✅ Error Toast
                toast.error("Failed to extract items. Please add manually.", { id: toastId });
            }

        } catch (error) {
            console.error("❌ Error during extraction:", error);
            // ✅ Error Toast
            toast.error("Error connecting to extraction service.", { id: toastId });
        } finally {
            setIsScanning(false);
            e.target.value = null; 
        }
    };

    const handleSave = async () => {
        for (let item of items) {
            if (!item.name || !String(item.price).trim()) {
                // ✅ Toast
                toast.error(`Missing details for items in "${item.category}".`);
                return;
            }
        }

        const storeId = storeDetails?.storeId || storeDetails?.id || storeDetails?.store_id;
        if (!storeId) {
            toast.error("Missing store ID. Please create the store first."); // ✅ Toast
            return;
        }

        const payloadItems = items.map(item => ({
            name: item.name.trim(),
            price: Math.round((Number(item.price) || 0) * 100),
            categories: item.categories || (item.category ? [item.category] : []),
            quantity: Number(item.quantity) || 0
        }));

        setIsSaving(true);
        const toastId = toast.loading("Saving store inventory..."); // ✅ Loading Toast

        try {
            const response = await axios.post('/api/stores/add-items', { store_id: storeId, items: payloadItems }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                toast.success("Items saved successfully!", { id: toastId }); // ✅ Success Toast
                navigate('/vendor/view-store', { 
                    state: { 
                        storeDetails: storeDetails 
                    } 
                });
            } else {
                toast.error(response.data?.message || "Failed to add items", { id: toastId }); // ✅ Error Toast
            }
        } catch (error) {
            console.error("Error saving items:", error);
            toast.error(error.response?.data?.message || "Error adding items", { id: toastId }); // ✅ Error Toast
        } finally {
            setIsSaving(false);
        }
    };

    // --- Grouping Logic ---
    const getGroupedItems = () => {
        const groups = {};
        const query = searchQuery.toLowerCase();

        items.forEach(item => {
            if ((item.name || "").toLowerCase().includes(query)) {
                const cat = item.category || "Uncategorized";
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
            }
        });
        return groups;
    };

    const groupedItems = getGroupedItems();

    if (!storeDetails) return null;

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">

                {/* --- Header --- */}
                <div className="bg-white pt-8 pb-4 px-6 shadow-sm z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowBackIcon className="text-gray-700 w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 p-1 overflow-hidden">
                                <StoreIconDisplay iconId={storeDetails.logoId} className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">{storeDetails.name}</h2>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full mb-6">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                    </div>

                    {/* Upload Button */}
                    <div className="w-full">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isScanning || storeLoading}
                            className="w-full py-2.5 rounded-xl bg-gray-100 border border-dashed border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isScanning ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    <span>Extracting items...</span>
                                </>
                            ) : storeLoading ? (
                                <span>Loading store data...</span>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <span>Browse Image to Auto-Add Items</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- Content Area --- */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f8f9fd]">

                    <div className="flex px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <div className="flex-1">Item Name</div>
                        <div className="w-16 text-center">Price</div>
                        <div className="w-14 text-center">Qty</div>
                        <div className="w-6"></div>
                    </div>

                    {storeLoading && (
                        <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                            <span>Fetching items...</span>
                        </div>
                    )}

                    {!storeLoading && Object.keys(groupedItems).length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {searchQuery ? "No items found." : "No categories yet. Create one below!"}
                        </div>
                    )}

                    {!storeLoading && Object.keys(groupedItems).sort().map(category => (
                        <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex-1 flex items-center gap-2" onClick={(e) => {
                                    if (editingCategory !== category) toggleCategory(category);
                                }}>
                                    {editingCategory === category ? (
                                        <input
                                            type="text" autoFocus value={tempCategoryName}
                                            onChange={(e) => setTempCategoryName(e.target.value)}
                                            onBlur={() => saveCategoryName(category)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveCategoryName(category)}
                                            className="font-bold text-sm text-gray-800 bg-white border-b-2 border-blue-500 outline-none px-1 py-0.5 w-full"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <>
                                            <span className="font-bold text-sm text-gray-800 select-none">
                                                {category}
                                                <span className="text-gray-400 font-normal ml-2 text-xs">({groupedItems[category].length})</span>
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditingCategory(category);
                                                }}
                                                className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-all"
                                            >
                                                <EditIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div onClick={() => toggleCategory(category)} className={`cursor-pointer p-1 transform transition-transform duration-200 ${openCategories[category] ? 'rotate-180' : ''}`}>
                                    <DropdownIcon className="text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {openCategories[category] && (
                                <div className="border-t border-gray-100 bg-gray-50 p-2 space-y-2">
                                    {groupedItems[category].map(item => (
                                        <ItemRow key={item.id} item={item} onChange={handleItemChange} onDelete={deleteItem} />
                                    ))}
                                    <button onClick={() => addItemToCategory(category)} className="w-full py-2.5 mt-2 rounded-xl border border-dashed border-blue-200 text-blue-500 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                                        <PlusIconSmall className="w-4 h-4" /> Add item to {category}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <button onClick={addNewCategory} className="w-full py-4 mt-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                        <div className="w-6 h-6 text-white rounded-full flex items-center justify-center">
                            <PlusIconSmall className="w-4 h-4" />
                        </div>
                        Create New Category
                    </button>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 z-20">
                    <button onClick={handleSave} disabled={isSaving || storeLoading} className={`w-full ${isSaving || storeLoading ? 'opacity-60 cursor-not-allowed' : 'bg-[#22c55e] hover:bg-[#1fa850]'} text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all`}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

// ItemRow Component (Unchanged)
const ItemRow = ({ item, onChange, onDelete }) => (
    <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
        <div className="flex-1 min-w-0">
            <input type="text" value={item.name} onChange={(e) => onChange(item.id, 'name', e.target.value)} className="w-full text-sm font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300" placeholder="Item Name" autoFocus={!item.name} />
        </div>
        <div className="w-16 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-colors">
            <div className="flex items-center">
                <span className="text-[10px] text-gray-400 mr-0.5">₹</span>
                <input type="number" value={item.price} onChange={(e) => onChange(item.id, 'price', e.target.value)} className="w-full text-sm font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-center" placeholder="0" />
            </div>
        </div>
        <div className="w-14 bg-gray-50 rounded-lg px-1 py-1.5 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-colors">
            <input type="number" value={item.quantity} onChange={(e) => onChange(item.id, 'quantity', e.target.value)} className="w-full text-sm font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-center" placeholder="1" />
        </div>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
            <TrashIcon className="w-4 h-4" />
        </button>
    </div>
);

export default EditStoreItems;