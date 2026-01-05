import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LogoIcon,
  WalletIcon,
  SearchIcon,
  CheckBalanceIcon,
  WithdrawIcon,
  RecentIcon,
  SearchStoresIcon, 
} from '../../components/Icons';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { wallet, logout } = useAuthStore();

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  // Vendor Specific Actions
  const actions = [
    { 
      label: 'Check Balance', 
      icon: <CheckBalanceIcon />, // Using standard icon like Home.js
      onClick: () => navigate('/check-balance') 
    },
    { 
      label: 'Add Store', 
      // Custom Icon for Add Store (Store + Plus)
      icon: (
        <div className="relative">
          <SearchStoresIcon />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-white">
            +
          </div>
        </div>
      ), 
      onClick: () => navigate('/vendor/add-store') 
    },
    { 
      label: 'Withdraw Money', 
      icon: <WithdrawIcon />, 
      onClick: () => navigate('/moneytransfer', {
        state: {
          contact: {
            id: 'self',
            name: 'Bank Transfer',
            type: 'withdraw'
          },
          prefilledAmount: "",
          isPaymentFlow: false
        }
      })
    },
    { 
      label: 'Recent Transactions', 
      icon: <RecentIcon />, 
      onClick: () => navigate('/recent-transactions') 
    },
  ];

  return (
    // Outer Container - Matching Home.js (#1581BF)
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto font-sans">
      
      {/* Main Card - Matching Home.js Dimensions & Shape */}
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
                    <span className="text-[#36a736] font-bold mr-2 text-sm">₹ {Number(wallet).toFixed(2)}</span>
                    <WalletIcon />
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout} 
                    className="p-2 bg-red-50 hover:bg-red-100 rounded-full border border-red-100 transition-colors group"
                    title="Logout"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-red-600">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search My stores"
              className="w-full py-3.5 pl-12 pr-4 rounded-full bg-white border border-gray-200 shadow-sm outline-none text-gray-700 text-md placeholder-gray-400 focus:border-blue-400 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* --- HERO SECTION (Dark Blue) --- */}
        {/* Replaces the Scanner Section from Home.js */}
        <div className="bg-[#065d94] flex flex-col items-center justify-center py-8 relative text-white">
            {/* Big Store Icon */}
            <div className="mb-4">
               <svg width="100" height="100" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0">
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"></path>
               </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-wide">My Stores</h2>
        </div>

        {/* --- Footer Action Grid (White/Gray) --- */}
        <div className="bg-[#f8f9fd] px-6 py-8 flex-1">
            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
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

export default VendorDashboard;