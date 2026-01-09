import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeFromLib from 'react-qr-code';
import { useAuthStore } from '../../store/useAuthStore';
import useMerchantStore from '../../store/useMerchantStore';
import { ArrowBackIcon } from '../../components/Icons';

const VendorQRPage = () => {
    const navigate = useNavigate();
    const { user, token } = useAuthStore();
    const { stores, fetchStores } = useMerchantStore();
    
    // 1. Initialize State as an empty string (Personal Wallet)
    const [selectedStoreId, setSelectedStoreId] = useState(""); 

    const QRCode = QRCodeFromLib.default || QRCodeFromLib;

    useEffect(() => {
        const load = async () => {
            if(token) await fetchStores(token);
        };
        load();
    }, [token, fetchStores]);

    // ✅ FIX 1: Robust Finding Logic
    // We strictly convert both sides to String() so "101" matches 101
    const selectedStore = stores.find(s => String(s.id) === String(selectedStoreId));

    // ✅ FIX 2: Debugging Log (Check your console if it still fails)
    // console.log("Selected ID:", selectedStoreId, "Found Store:", selectedStore);

    // Display Name Logic
    const displayName = selectedStore ? selectedStore.name : `${user?.name} (Personal)`;

    // QR Payload
    const qrPayload = selectedStore 
        ? { id: selectedStore.id, type: 'store' }
        : { id: user?.user_id, type: 'user' };

    const qrCodeValue = JSON.stringify(qrPayload);
    
    // Handle Change Helper
    const handleSelectionChange = (e) => {
        const val = e.target.value;
        setSelectedStoreId(val); 
    };

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-white pt-8 pb-6 px-6 flex items-center shadow-sm z-10 relative">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors absolute left-6"
                    >
                        <ArrowBackIcon className="text-gray-700 w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 w-full text-center">Receive Payment</h1>
                </div>

                <div className="flex-1 flex flex-col items-center bg-[#f8f9fd] px-6 pt-8 pb-10 overflow-y-auto">

                    {/* Store Selector Dropdown */}
                    <div className="w-full mb-8">
                        <label className="block text-sm font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wide">
                            Select Account / Store
                        </label>
                        
                        <div className="relative">
                            <select 
                                // ✅ FIX 3: Ensure value is always a string
                                value={String(selectedStoreId)} 
                                onChange={handleSelectionChange}
                                className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-800 font-bold outline-none focus:border-blue-500 shadow-sm appearance-none"
                            >
                                {/* Personal Option */}
                                <option value="">Personal Wallet ({user?.name})</option>
                                
                                {/* Store Options */}
                                {stores.map((store) => (
                                    // ✅ FIX 4: Explicitly cast ID to string in value prop
                                    <option key={store.id} value={String(store.id)}>
                                        Store: {store.name}
                                    </option>
                                ))}
                            </select>
                            
                            {/* Dropdown Arrow */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    <div className="bg-white p-6 rounded-[30px] shadow-xl border border-gray-100 flex flex-col items-center w-full max-w-[300px]">
                        <div className="mb-6 text-center">
                            <h2 className="text-lg font-bold text-gray-900 truncate max-w-[250px] leading-tight">
                                {displayName}
                            </h2>
                            <p className="text-xs text-gray-400 font-medium mt-1">Scan to Pay</p>
                        </div>

                        <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={qrCodeValue}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 bg-blue-50 px-5 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-blue-600 font-bold text-sm tracking-wide">
                                CashApp Pay
                            </span>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-gray-400 text-sm max-w-[250px] leading-relaxed">
                        Ask the customer to scan this QR code to pay directly to 
                        <span className="font-bold text-gray-600"> {selectedStoreId ? "this store" : "your wallet"}</span>.
                    </p>

                </div>
            </div>
        </div>
    );
};

export default VendorQRPage;