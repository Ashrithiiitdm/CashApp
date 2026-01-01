import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon} from '../components/Icons'; // Ensure you have a check icon or use text

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get transaction details passed from the previous page
  const { amount, contact, transactionId, time } = location.state || {};

  // Safety check: If someone tries to access this page directly without data, go home
  if (!amount || !contact) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
      
      {/* Main Card */}
      <div className="bg-white w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
        
        {/* --- Top Header with Back Button --- */}
        <div className="w-full p-8 flex justify-start">
            <button 
                onClick={() => navigate('/home')} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors"
            >
                <ArrowBackIcon className="w-6 h-6 text-gray-600" />
            </button>
        </div>

        {/* --- Success Animation/Icon --- */}
        <div className="mt-4 mb-6 relative">
            {/* Pulsing Green Background */}
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-green-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
        </div>

        {/* --- Main Text --- */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 font-medium text-sm mb-8">
            Transaction ID: {transactionId}
        </p>

        {/* --- Amount --- */}
        <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-gray-900">
                ₹{Number(amount).toFixed(2)}
            </h1>
        </div>

        {/* --- Receipt Details Card --- */}
        <div className="w-full px-8">
            <div className="bg-[#f8f9fd] rounded-2xl p-6 border border-gray-100">
                
                {/* Paid To */}
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <span className="text-gray-500 text-sm font-medium">Paid to</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{contact.name}</span>
                        {contact.avatar && (
                             <img src={contact.avatar} alt="avatar" className="w-6 h-6 rounded-full" />
                        )}
                    </div>
                </div>

                {/* Time */}
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <span className="text-gray-500 text-sm font-medium">Time</span>
                    <span className="font-bold text-gray-800">{time}</span>
                </div>

                {/* Payment Method */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm font-medium">Payment Mode</span>
                    <span className="font-bold text-gray-800">CashPay Wallet</span>
                </div>

            </div>
        </div>

        {/* --- Bottom Action --- */}
        <div className="mt-auto mb-10 w-full px-8">
            <button 
                onClick={() => navigate('/home')}
                className="w-full bg-[#1581BF] text-white text-lg font-bold py-4 rounded-[25px] shadow-lg hover:bg-[#0D6A9F] active:scale-[0.98] transition-all"
            >
                Done
            </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;