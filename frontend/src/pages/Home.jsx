import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
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
  const navigate = useNavigate();

  // 1. Get wallet, user, and the logout function
  const wallet = useAuthStore((state) => state.wallet);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Clear state and redirect
    if (logout) logout();
    navigate('/login');
  };

  const actions = [
    { label: 'Pay People', icon: <PayPeopleIcon />, onClick: () => navigate('/paypeople') },
    {
      label: 'Add money', icon: <AddMoneyIcon />, onClick: () => navigate('/moneytransfer', {
        state: {
          contact: {
            id: user?.id || 'self',
            name: 'My Wallet',
            type: 'add-money'
          },
          prefilledAmount: "",
          isPaymentFlow: false
        }
      })
    },
    { label: 'Recent Transactions', icon: <RecentIcon />, onClick: () => navigate('/recent-transactions') },
    { label: 'Check Balance', icon: <CheckBalanceIcon />, onClick: () => navigate('/check-balance') },
    { label: 'Search Stores', icon: <SearchStoresIcon />, onClick: () => navigate('/search-stores') },
    {
      label: 'Withdraw Money', icon: <WithdrawIcon />, onClick: () => navigate('/moneytransfer', {
        state: {
          contact: {
            id: user?.id || 'self',
            name: 'Bank Transfer',
            type: 'withdraw'
          },
          prefilledAmount: "",
          isPaymentFlow: false
        }
      })
    },
  ];

  const clickScanner = () => {
    console.log("Scanner clicked!");
    navigate('/qrscanner');
  };

  const clickSearch = () => {
    console.log("Search clicked!");
    navigate('/paypeople', { state: { focusSearch: true } });
  };

  return (
    // Outer Container - Matching Signup Page (#1581BF)
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto font-sans">

      {/* Scanner Animation Style */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 80%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main Card */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">

        {/* --- Header Section (White) --- */}
        <div className="bg-white pt-10 pb-6 px-8">
          <div className="flex justify-between items-center mb-6">
            {/* Left Logo */}
            <LogoIcon />

            {/* Right Side: Wallet + Logout Group */}
            <div className="flex items-center gap-3">
              
              {/* Balance Pill */}
              <div className="flex items-center bg-[#eef7ee] border border-[#dcf0dc] rounded-full px-4 py-1.5">
                <span className="text-[#36a736] font-bold mr-2">₹ {Number(wallet).toFixed(2)}</span>
                <WalletIcon />
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-full border border-red-100 transition-colors flex items-center justify-center group"
                title="Logout"
              >
                <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-red-500 group-hover:text-red-600"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div onClick={clickSearch} className="relative w-full">
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
              <div key={index} onClick={item.onClick} className="flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform duration-200">
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