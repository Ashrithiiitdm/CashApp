import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon, ImageIcon} from '../../components/Icons';
import { StoreIcon1, StoreIcon2, StoreIcon3, StoreIcon4, StoreIcon5, StoreIcon6, StoreIcon7, StoreIcon8, StoreIcon9, StoreIcon10, StoreIcon11 } from '../../components/StoreIcons';

const AddStore = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    logoIndex: 0, // Default to first icon
    imageFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Available icons for selection
  const storeIcons = [
    { component: <StoreIcon1 className="w-8 h-8 text-[#065d94]" />, id: 1 },
    { component: <StoreIcon2 className="w-8 h-8 text-[#065d94]" />, id: 2 },
    { component: <StoreIcon3 className="w-8 h-8 text-[#065d94]" />, id: 3 },
    { component: <StoreIcon4 className="w-8 h-8 text-[#065d94]" />, id: 4 },
    { component: <StoreIcon5 className="w-8 h-8 text-[#065d94]" />, id: 5 },
    { component: <StoreIcon6 className="w-8 h-8 text-[#065d94]" />, id: 6 },
    { component: <StoreIcon7 className="w-8 h-8 text-[#065d94]" />, id: 7 },
    { component: <StoreIcon8 className="w-8 h-8 text-[#065d94]" />, id: 8 },
    { component: <StoreIcon9 className="w-8 h-8 text-[#065d94]" />, id: 9 },
    { component: <StoreIcon10 className="w-8 h-8 text-[#065d94]" />, id: 10 },
    { component: <StoreIcon11 className="w-8 h-8 text-[#065d94]" />, id: 11 },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setStoreData({ ...storeData, imageFile: e.target.files[0] });
    }
  };

  const handleCreate = async () => {
    if (!storeData.name || !storeData.address) {
      alert("Please fill in store name and address.");
      return;
    }

    setIsLoading(true);
    
    let extractedItems = [];

    // --- SIMULATION OF IMAGE EXTRACTION ---
    if (storeData.imageFile) {
      // In a real app, you would send the image to your backend here.
      console.log("Uploading image and extracting items...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      
      // Mock extracted data
      extractedItems = [
        { id: 1, name: "Classmate Notebook", price: 75, category: "Stationery", quantity: 10 },
        { id: 2, name: "Ball Pen Blue", price: 10, category: "Stationery", quantity: 50 },
        { id: 3, name: "A4 Paper Ream", price: 220, category: "Office", quantity: 5 },
      ];
    }
    // ------------------------------------

    setIsLoading(false);

    // Navigate to the Edit Items page, passing store details and initial items
    navigate('/vendor/edit-items', { 
      state: { 
        storeDetails: {
            name: storeData.name,
            address: storeData.address,
            logoId: storeData.logoIndex
        },
        initialItems: extractedItems 
      } 
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white pt-8 pb-6 px-6 flex items-center relative shadow-sm z-10">
          <button onClick={() => navigate(-1)} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
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
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Store Name</label>
                <input 
                    type="text" 
                    value={storeData.name}
                    onChange={(e) => setStoreData({...storeData, name: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-blue-400 focus:ring-0 text-gray-800 outline-none transition-all shadow-sm font-medium"
                    placeholder="Enter store name"
                />
            </div>

            {/* Choose Logo Selector */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Choose a logo</label>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {storeIcons.map((icon) => (
                        <div 
                            key={icon.id}
                            onClick={() => setStoreData({...storeData, logoIndex: icon.id})}
                            className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer border-4 transition-all ${storeData.logoIndex === icon.id ? 'border-blue-400 bg-blue-50' : 'border-white bg-white shadow-sm'}`}
                        >
                            {icon.component}
                        </div>
                    ))}
                </div>
            </div>

             {/* Address Input */}
             <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Address / Location</label>
                <textarea 
                    rows={4}
                    value={storeData.address}
                    onChange={(e) => setStoreData({...storeData, address: e.target.value})}
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
                    accept="image/*" 
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold transition-colors mb-3"
                >
                    <ImageIcon className="w-5 h-5" />
                    {storeData.imageFile ? "Change File" : "Browse"}
                </button>
                 <p className="text-sm text-gray-500 max-w-[200px] leading-tight">
                    {storeData.imageFile ? storeData.imageFile.name : "Take or upload image to build item list automatically"}
                </p>
            </div>

        </div>

        {/* Bottom Button */}
        <div className="p-6 bg-white pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
            <button 
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full bg-[#22c55e] hover:bg-[#1fa850] text-white text-lg font-bold py-4 rounded-full shadow-lg active:scale-[0.98] transition-all disabled:opacity-70"
            >
                {isLoading ? "Processing..." : "Create Store & Continue"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AddStore;