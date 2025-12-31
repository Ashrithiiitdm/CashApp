import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogoIcon,
  WalletIcon,
  SearchIcon,
  PayPeopleIcon,
  AddMoneyIcon,
  RecentIcon,
  CheckBalanceIcon,
  SearchStoresIcon,
  WithdrawIcon,
} from '../components/Icons'; // Adjust path based on your folder structure

import dummayQR from '../assets/icons/dummyQR.png'; // Dummy QR code image

const Home = () => {
  // Data for the bottom action grid
  const actions = [
    { label: 'Pay People', icon: <PayPeopleIcon /> },
    { label: 'Add money', icon: <AddMoneyIcon /> },
    { label: 'Recent Transactions', icon: <RecentIcon /> },
    { label: 'Check Balance', icon: <CheckBalanceIcon /> },
    { label: 'Search Stores', icon: <SearchStoresIcon /> },
    { label: 'Withdraw Money', icon: <WithdrawIcon /> },
  ];

  const navigate = useNavigate();

  const clickScanner = () => {
    console.log("Scanner clicked!");
    navigate('/qrscanner');
  };

  return (
    // Outer Container - Matching Signup Page (#1581BF)
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto font-sans">
      
      {/* Scanner Animation Style */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 80%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main Card - Matching Signup Page Dimensions & Shape
         - w-11/12 max-w-[420px]
         - min-h-[750px]
         - rounded-[40px]
         - shadow-2xl
         - Added 'overflow-hidden' so inner colors don't break the rounded corners
      */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* --- Header Section (White) --- */}
        <div className="bg-white pt-10 pb-6 px-8">
          <div className="flex justify-between items-center mb-6">
            {/* Left Logo */}
            <LogoIcon />
            
            {/* Right Balance Pill */}
            <div className="flex items-center bg-[#eef7ee] border border-[#dcf0dc] rounded-full px-4 py-1.5">
               <span className="text-[#36a736] font-bold mr-2">₹ 500.00</span>
               <WalletIcon />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search stores or people to pay"
              className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* --- Scanner Section (Dark Blue) --- */}
        <div className="bg-[#065d94] flex items-center justify-center py-8 relative">
            {/* White QR Container */}
            <div onClick={clickScanner} className="w-44 h-44 bg-white rounded-3xl flex items-center justify-center relative p-2 overflow-hidden shadow-lg">
                
                <img
                    src={dummayQR}
                    alt='QR code scanner'
                    className='p-2'
                />


                {/* Animated Scanner Line */}
                <div className="absolute left-0 w-full h-[3px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-scan z-10"></div>
            </div>
        </div>

        {/* --- Footer Action Grid (White/Gray) --- */}
        <div className="bg-[#f8f9fd] px-6 py-4">
            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
                {actions.map((item, index) => (
                    <div key={index} className="flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform duration-200">
                        <div className="mb-1">
                           {item.icon}
                        </div>
                        <span className="text-[#065d94] text-[13px] font-semibold leading-tight max-w-[80px]">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Home;