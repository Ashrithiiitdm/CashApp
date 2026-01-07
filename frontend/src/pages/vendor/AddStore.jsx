import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBackIcon, ImageIcon } from "../../components/Icons";
import { STORE_ICONS_MAP, StoreIconDisplay } from "../../components/StoreIcons";
import axios from "../../config/axiosConfig";
import { useAuthStore } from "../../store/useAuthStore";

const AddStore = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { token } = useAuthStore();

    const [storeData, setStoreData] = useState({
        name: "",
        address: "",
        // Default to the first key in the map
        iconId: "store_1",
        imageFile: null,
    });

    const availableIcons = Object.keys(STORE_ICONS_MAP);

    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileSizeInMB = file.size / (1024 * 1024);
            
            if (fileSizeInMB > 1) {
                alert(`File size is ${fileSizeInMB.toFixed(2)} MB. Please upload a file smaller than 1 MB.`);
                e.target.value = ''; // Reset file input
                return;
            }
            
            setStoreData({ ...storeData, imageFile: file });
        }
    };

    const handleCreate = async () => {
        if (!storeData.name || !storeData.address) {
            alert("Please fill in store name and address.");
            return;
        }

        setIsLoading(true);

        try {
            // Call the backend API to create the store
            const response = await axios.post(
                "/api/stores",
                {
                    name: storeData.name,
                    location: storeData.address,
                    store_logo: storeData.iconId, // Send the icon ID (e.g., "store_1")
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                let extractedItems = [];

                // --- EXTRACT ITEMS FROM IMAGE/PDF IF PROVIDED ---
                if (storeData.imageFile) {
                    console.log("📤 Uploading file for item extraction...");
                    setIsExtracting(true);

                    try {
                        const formData = new FormData();
                        formData.append("file", storeData.imageFile);

                        const extractResponse = await axios.post(
                            "/api/stores/extract-items",
                            formData,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "multipart/form-data",
                                },
                            }
                        );

                        if (extractResponse.data.success) {
                            extractedItems = extractResponse.data.items;
                            console.log(
                                `✅ Extracted ${extractedItems.length} items`
                            );
                        } else {
                            console.error(
                                "⚠️  Extraction failed:",
                                extractResponse.data.message
                            );
                            alert(
                                "Failed to extract items. You can add them manually."
                            );
                        }
                    } catch (extractError) {
                        console.error("❌ Error during extraction:", extractError);
                        alert(
                            "Error extracting items from file. You can add them manually."
                        );
                    } finally {
                        setIsExtracting(false);
                    }
                }
                // ------------------------------------
                const storeId = response.data.store_id;

                // Navigate to the Edit Items page, passing store details and initial items
                navigate("/vendor/edit-items", {
                    state: {
                        storeDetails: {
                            name: storeData.name,
                            address: storeData.address,
                            logoId: storeData.iconId,
                            storeId,
                        },
                        initialItems: extractedItems,
                    },
                });
            }
        } catch (error) {
            console.error("Error creating store:", error);
            alert(
                error.response?.data?.message ||
                    "Failed to create store. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white pt-8 pb-6 px-6 flex items-center relative shadow-sm z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowBackIcon className="text-gray-700 w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 w-full text-center">
                        Create a new store
                    </h2>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto bg-[#f8f9fd]">
                    {/* Store Name Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                            Store Name
                        </label>
                        <input
                            type="text"
                            value={storeData.name}
                            onChange={(e) =>
                                setStoreData({
                                    ...storeData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-blue-400 focus:ring-0 text-gray-800 outline-none transition-all shadow-sm font-medium"
                            placeholder="Enter store name"
                        />
                    </div>

                    {/* Choose Logo Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">
                            Choose a logo
                        </label>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                            {availableIcons.map((key) => (
                                <div
                                    key={key}
                                    onClick={() =>
                                        setStoreData({
                                            ...storeData,
                                            iconId: key,
                                        })
                                    }
                                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-4 transition-all 
                    ${storeData.iconId === key ? "border-blue-400 bg-blue-50 scale-110" : "border-transparent bg-white shadow-md"}`}
                                >
                                    {/* Use the helper to render */}
                                    <StoreIconDisplay
                                        iconId={key}
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address Input */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                            Address / Location
                        </label>
                        <textarea
                            rows={4}
                            value={storeData.address}
                            onChange={(e) =>
                                setStoreData({
                                    ...storeData,
                                    address: e.target.value,
                                })
                            }
                            className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-blue-400 focus:ring-0 text-gray-800 outline-none transition-all shadow-sm font-medium resize-none"
                            placeholder="Enter complete store address"
                        />
                    </div>

                    {/* File Upload Box */}
                    <div className="mb-10 bg-white p-6 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,application/pdf"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold transition-colors mb-3"
                            disabled={isLoading || isExtracting}
                        >
                            <ImageIcon className="w-5 h-5" />
                            {storeData.imageFile ? "Change File" : "Browse"}
                        </button>
                        <p className="text-sm text-gray-500 max-w-[200px] leading-tight">
                            {storeData.imageFile
                                ? storeData.imageFile.name
                                : "Upload image or PDF to auto-extract items and prices"}
                        </p>
                    </div>
                </div>

                {/* Bottom Button */}
                <div className="p-6 bg-white pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || isExtracting}
                        className="w-full bg-[#22c55e] hover:bg-[#1fa850] text-white text-lg font-bold py-4 rounded-full shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isExtracting
                            ? "Extracting Items..."
                            : isLoading
                            ? "Creating Store..."
                            : "Create Store & Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStore;
