import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../config/axiosConfig'; 
import { useAuthStore } from '../../store/useAuthStore'; 
import useMerchantStore from '../../store/useMerchantStore'; 
import toast from 'react-hot-toast'; // ✅ Import toast
import { 
  ArrowBackIcon, 
  EditIcon,
} from '../../components/Icons';
import { StoreIconDisplay } from '../../components/StoreIcons';


const ViewStore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeDetails } = location.state || {};
  const { token } = useAuthStore();

  // --- Local State for Editing ---
  const [name, setName] = useState(storeDetails?.name || "");
  const [address, setAddress] = useState(storeDetails?.address || "");
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { updateStoreInList } = useMerchantStore();

  if (!storeDetails) return null; 

  // --- Actions ---

  const handleUpdateStore = async (field) => {
    if (!name.trim() || !address.trim()) {
        toast.error("Name and Address cannot be empty."); // ✅ Toast
        return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Updating store details..."); // ✅ Loading Toast

    try {
        const response = await axios.put('/api/stores/update', {
            store_id: storeDetails.storeId,
            name: name,
            location: address 
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            updateStoreInList(storeDetails.storeId, {
                name: name,
                address: address,
                display_name: name, 
                location: address 
            });

            // 2. Exit edit mode
            if (field === 'name') setIsEditingName(false);
            if (field === 'address') setIsEditingAddress(false);
            
            toast.success("Store updated successfully!", { id: toastId }); // ✅ Success Toast
            
        } else {
            toast.error(response.data.message || "Failed to update store.", { id: toastId }); // ✅ Error Toast
        }
    } catch (error) {
        console.error("Update failed:", error);
        toast.error("Error updating store. Please try again.", { id: toastId }); // ✅ Error Toast
    } finally {
        setIsSaving(false);
    }
  };

  // Navigation Handlers
  const handleEditItems = () => {
    navigate('/vendor/edit-items', { 
        state: { 
            storeDetails: { ...storeDetails, name, address } 
        } 
    });
  };

  const handleTransactionHistory = () => {
    navigate('/recent-transactions', { 
        state: { initialSearch: name } 
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
       <div className="bg-white w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
          
          {/* Header Back Button */}
          <div className="pt-8 px-6 pb-2">
             <button 
                onClick={() => navigate(-1)} 
                className="hover:bg-gray-100 p-2 -ml-2 rounded-full transition-colors"
             >
                <ArrowBackIcon className="text-gray-800 w-6 h-6"/>
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-8 pt-4 flex flex-col">
              
              {/* Store Title & Details Section */}
              <div className="flex flex-col items-center mb-10">
                 <div className="w-24 h-24 mb-4">
                    <StoreIconDisplay iconId={storeDetails.logoId} className="w-full h-full object-contain" />
                 </div>
                 
                 {/* --- Editable Name --- */}
                 <div className="flex items-center justify-center gap-2 mb-6 w-full">
                    {isEditingName ? (
                        <div className="flex items-center gap-2 w-full max-w-[250px]">
                            <input 
                               type="text" 
                               value={name}
                               onChange={(e) => setName(e.target.value)}
                               className="text-xl font-bold text-gray-900 text-center border-b-2 border-blue-500 outline-none w-full py-1"
                               autoFocus
                            />
                            <button 
                               onClick={() => handleUpdateStore('name')}
                               disabled={isSaving}
                               className="bg-green-100 text-green-600 p-1.5 rounded-full hover:bg-green-200"
                            >
                               {/* Checkmark SVG */}
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight truncate max-w-[250px]">
                               {name}
                            </h1>
                            <button 
                               onClick={() => setIsEditingName(true)}
                               className="text-blue-500 hover:bg-blue-50 p-1 rounded-full transition-colors"
                            >
                               <EditIcon className="w-5 h-5" /> 
                            </button>
                        </>
                    )}
                 </div>

                 {/* --- Editable Address --- */}
                 <div className="w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className="font-bold text-sm text-gray-800">Address</span>
                       {!isEditingAddress && (
                           <button 
                              onClick={() => setIsEditingAddress(true)}
                              className="text-blue-500 hover:bg-blue-50 p-1 rounded-full transition-colors"
                           >
                              <EditIcon className="w-3.5 h-3.5" />
                           </button>
                       )}
                    </div>
                    
                    {isEditingAddress ? (
                        <div className="relative">
                            <textarea 
                               value={address}
                               onChange={(e) => setAddress(e.target.value)}
                               className="w-full text-sm text-gray-800 border-2 border-blue-100 rounded-xl p-3 focus:border-blue-400 outline-none resize-none bg-gray-50"
                               rows={3}
                               autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => { setIsEditingAddress(false); setAddress(storeDetails.address); }}
                                    className="text-xs text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleUpdateStore('address')}
                                    disabled={isSaving}
                                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 font-bold"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                           {address || "No address provided for this store."}
                        </p>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-5 mt-2">
                 <button 
                    onClick={handleEditItems}
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg flex justify-center items-center"
                 >
                    View/Edit Item List
                 </button>

                 <button 
                    onClick={handleTransactionHistory}
                    className="w-full bg-[#1581BF] hover:bg-[#1271a3] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg flex justify-center items-center"
                 >
                    Transaction History
                 </button>

                 <button 
                    onClick={() => toast("Employee management coming soon!", { icon: '🚧' })}
                    className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg flex justify-center items-center"
                 >
                    Add/View employee
                 </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default ViewStore;