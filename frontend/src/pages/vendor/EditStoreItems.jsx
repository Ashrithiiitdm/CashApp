import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowBackIcon, SearchStoresIcon, AddIcon, TrashIcon } from '../../components/Icons';
import { v4 as uuidv4 } from 'uuid';

const EditStoreItems = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data passed from AddStore page
  const { storeDetails, initialItems } = location.state || {};

  const [items, setItems] = useState([]);

  // Initialize items on load
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
    } else {
        // Add one empty row if starting fresh
        addItemRow();
    }
  }, [initialItems]);


  const addItemRow = () => {
    setItems([...items, { id: uuidv4(), name: '', price: '', category: '', quantity: 1 }]);
  };

  const removeItemRow = (idToRemove) => {
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleSave = () => {
    // Filter out empty rows before saving
    const validItems = items.filter(item => item.name.trim() !== '');
    
    console.log("Saving Store Details:", storeDetails);
    console.log("Saving Items:", validItems);
    
    alert("Store and Items Saved Successfully! (Check console for data)");
    // In real app: API call to save everything, then navigate back to dashboard
    navigate('/vendor-dashboard');
  };

  if (!storeDetails) {
      navigate('/vendor-dashboard');
      return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header - Customized with Store Info */}
        <div className="bg-white pt-8 pb-6 px-6 flex flex-col items-center relative shadow-sm z-10">
          <button onClick={() => navigate(-1)} className="absolute left-6 top-8 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
             <ArrowBackIcon className="text-gray-700 w-6 h-6" />
          </button>
          
          {/* Store Icon & Name */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-100 mb-2">
                <SearchStoresIcon className="w-8 h-8 text-[#065d94]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{storeDetails.name}</h2>
            <p className="text-xs text-gray-500 text-center max-w-[250px] mt-1 leading-tight">{storeDetails.address}</p>
          </div>
        </div>

        {/* Content Section - Item List */}
        <div className="flex-1 flex flex-col px-5 py-6 overflow-y-auto bg-[#f8f9fd]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#065d94]">Add / Edit Items</h3>
                 {/* Add Item Button (Small) */}
                <button 
                    onClick={addItemRow}
                    className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-[#065d94] px-3 py-1.5 rounded-full font-bold text-sm transition-colors"
                >
                    <AddIcon className="w-4 h-4" />
                    Add Item
                </button>
            </div>
            
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative animate-in fade-in slide-in-from-bottom-4">
                        
                        {/* Remove Button (Top Right) */}
                        {items.length > 1 && (
                             <button 
                                onClick={() => removeItemRow(item.id)}
                                className="absolute top-4 right-4 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                             >
                                 <TrashIcon className="w-4 h-4" />
                             </button>
                        )}
                       
                       <div className="grid grid-cols-3 gap-3 mb-3 pr-8">
                           {/* Name */}
                           <div className="col-span-2">
                               <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Item Name</label>
                               <input 
                                   type="text" 
                                   value={item.name}
                                   onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                   className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-400 focus:bg-white text-gray-800 outline-none text-sm font-medium transition-all"
                                   placeholder="e.g. Notebook"
                               />
                           </div>
                           {/* Price */}
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Price (₹)</label>
                               <input 
                                   type="number" 
                                   value={item.price}
                                   onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                   className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-400 focus:bg-white text-gray-800 outline-none text-sm font-bold text-center transition-all"
                                   placeholder="0"
                               />
                           </div>
                       </div>

                       <div className="grid grid-cols-3 gap-3">
                            {/* Categories */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Category / Tags</label>
                                <input 
                                    type="text" 
                                    value={item.category}
                                    onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-400 focus:bg-white text-gray-600 outline-none text-xs transition-all"
                                    placeholder="e.g. Stationery, Office"
                                />
                            </div>
                             {/* Quantity - NEW FIELD */}
                             <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Qty.</label>
                               <input 
                                   type="number" 
                                   value={item.quantity}
                                   onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                   className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-400 focus:bg-white text-gray-800 outline-none text-sm font-bold text-center transition-all"
                                   placeholder="1"
                               />
                           </div>
                       </div>

                    </div>
                ))}
            </div>

             {/* Add Item Button (Big Bottom) */}
            <button 
                onClick={addItemRow}
                className="w-full flex items-center justify-center gap-2 mt-6 bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-500 px-6 py-4 rounded-2xl font-bold transition-all"
            >
                <AddIcon className="w-5 h-5" />
                Add Another Item
            </button>

        </div>

        {/* Bottom Save Button */}
        <div className="p-6 bg-white pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
            <button 
                onClick={handleSave}
                className="w-full bg-[#22c55e] hover:bg-[#1fa850] text-white text-lg font-bold py-4 rounded-full shadow-lg active:scale-[0.98] transition-all"
            >
                Save Store & Items
            </button>
        </div>

      </div>
    </div>
  );
};

export default EditStoreItems;