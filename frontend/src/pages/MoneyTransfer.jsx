import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; // Access wallet balance
import { 
  ArrowBackIcon, 
  UserNameIcon, 
  SearchStoresIcon 
} from '../components/Icons'; // Import your icons

const MoneyTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Get the contact passed from the previous page
  const contact = location.state?.contact;

  // 2. Get wallet balance from store
  const { wallet, login } = useAuthStore(); // We might need login/setWallet to update balance later
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Redirect if no contact data found (e.g. direct URL access)
  if (!contact) {
    navigate('/paypeople');
    return null;
  }

  const handlePay = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (value > wallet) {
      setError("Insufficient balance");
      return;
    }

    // --- TODO: Add your API Call logic here ---
    console.log(`Paying ₹${value} to ${contact.name}`);
    alert("Payment Successful! (Logic to be implemented)");
    
    // For demo: Navigate back
    navigate('/home');
  };

  return (
    // Outer Container - Matching Home Page (#1581BF)
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      
      {/* Main Card - Matching Home Page Dimensions & Shape */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* --- Header Section (White) --- */}
        <div className="bg-white pt-8 pb-6 px-6 shadow-sm z-10 flex flex-col items-center relative">
          
          {/* Back Button (Absolute Positioned) */}
          <button 
            onClick={() => navigate(-1)} 
            className="absolute left-6 top-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowBackIcon className="w-6 h-6 text-gray-700" />
          </button>

          {/* Contact Avatar - Large & Centered */}
          <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-3 mt-4">
             {contact.type === 'person' && contact.avatar ? (
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
             ) : contact.type === 'store' ? (
                <SearchStoresIcon className="w-8 h-8 text-blue-500" />
             ) : (
                <UserNameIcon className="w-8 h-8 text-gray-400" />
             )}
          </div>

          {/* Name & ID */}
          <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Paying to {contact.type === 'store' ? 'Store' : 'User'}
          </p>

          {/* Available Balance Badge */}
          <div className="mt-2 bg-[#eef7ee] border border-[#dcf0dc] px-4 py-1.5 rounded-full">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide mr-2">Available:</span>
            <span className="text-[#36a736] font-bold text-sm">₹ {Number(wallet || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* --- Content Section --- */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 space-y-8">
            
            {/* Amount Input */}
            <div className="w-full">
                <label className="block text-center text-gray-500 text-sm font-bold mb-4 uppercase tracking-wider">
                    Enter Amount
                </label>
                <div className="relative flex justify-center items-center p-2">
                    <span className="absolute left-8 text-4xl font-bold text-gray-400">₹</span>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setError('');
                        }}
                        placeholder="0"
                        className="w-full bg-white text-center text-4xl font-bold text-gray-800 py-6 pr-3 rounded-3xl border-2 border-transparent focus:border-blue-400 focus:shadow-lg outline-none transition-all placeholder-gray-200"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center mt-2 font-medium">{error}</p>}
            </div>

            {/* Note Input (Optional) */}
            <div className="w-full">
                <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note (optional)"
                    className="w-full bg-white text-center py-4 rounded-2xl border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-400 outline-none transition-all shadow-sm"
                />
            </div>

        </div>

        {/* --- Footer Action --- */}
        <div className="p-8 bg-[#f8f9fd]">
            <button 
                onClick={handlePay}
                className="w-full bg-[#1581BF] text-white text-xl font-bold py-4 rounded-[25px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
                Pay Now
            </button>
        </div>

      </div>
    </div>
  );
};

export default MoneyTransfer;