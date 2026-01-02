import React from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeFromLib from 'react-qr-code'; 
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowBackIcon, 
  WalletIcon, 
} from '../components/Icons';

const CheckBalance = () => {
  const navigate = useNavigate();
  const { user, wallet } = useAuthStore();

  // FIX: Handle bundler import mismatch safely
  const QRCode = QRCodeFromLib.default || QRCodeFromLib;

  // Fallback if ID is missing to prevent empty QR
  const qrPayload = {
    id: user?.user_id, 
    type: 'user' 
  };

  const qrCodeValue = JSON.stringify(qrPayload);

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white pt-8 pb-4 px-6 flex justify-between items-start">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
             <ArrowBackIcon className="text-gray-700 w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
             <WalletIcon className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center bg-white px-6 pt-2 pb-10 rounded-b-[40px] shadow-sm z-10">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-2">My Wallet</h1>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-3xl border-2 border-gray-100 shadow-sm mb-6">
                <div style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                    <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={qrCodeValue}
                        viewBox={`0 0 256 256`}
                    />
                </div>
            </div>

            {/* Balance */}
            <div className="flex flex-col items-center mb-8">
                <span className="text-[#22c55e] text-3xl font-bold tracking-tight">
                    ₹ {Number(wallet).toFixed(2)}
                </span>
            </div>

            {/* --- NEW: Two Separate Buttons --- */}
            <div className="flex w-full max-w-[300px] gap-3 mb-6">
                
                {/* 1. Add Money Button */}
                <button 
                    onClick={() => alert("Open Add Money Modal")}
                    className="flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100 active:scale-95 transition-all"
                >
                    <div className="mb-1">
                        {/* Plus Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="font-bold text-sm">Add Money</span>
                </button>

                {/* 2. Withdraw Button */}
                <button 
                    onClick={() => alert("Open Withdraw Modal")}
                    className="flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <div className="mb-1">
                        {/* Arrow Up/Right Icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="font-bold text-sm">Withdraw</span>
                </button>

            </div>
            {/* --------------------------------- */}

            <button 
                onClick={() => navigate('/recent-transactions')}
                className="w-[280px] py-4 rounded-full border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors bg-white"
            >
                See transaction history
            </button>

        </div>

        <div className="flex-grow bg-[#f8f9fd]"></div>

      </div>
    </div>
  );
};

export default CheckBalance;