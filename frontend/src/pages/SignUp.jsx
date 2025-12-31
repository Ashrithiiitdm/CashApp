import React, { useState } from 'react';
import InputField from '../components/InputField'; // Adjust path based on your folder structure
import { EyeIcon, LogoIcon, EmailIcon, UserNameIcon } from '../components/Icons'; // Adjust path based on your folder structure
import GoogleSignUp from '../components/GoogleSignUp';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [activeTab, setActiveTab] = useState('User');
  const tabs = ['User', 'Vendor', 'Employee'];

  const navigate = useNavigate();

  const registerUser = () => {
    // TODO: Add your verification/API logic here
    console.log("Verifying user...");

    // Redirect to the home page (assuming your route is '/home')
    navigate('/home');
  };

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Main Card */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl px-8 py-12 flex flex-col items-center relative justify-start">
        
        {/* --- Header Section --- */}
        <div className="w-full flex flex-col items-start pl-2">
          <div className="flex items-center gap-3 mb-8">
            <LogoIcon />
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">CashPay</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mb-4 ml-2 w-full justify-start border-b border-gray-200/50 relative">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-lg font-medium transition-colors relative
                  ${activeTab === tab ? 'text-[#1581BF]' : 'text-gray-400 hover:text-gray-500'}`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1581BF] rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* --- Form Section --- */}
        <div className="w-full flex flex-col gap-4 mb-8">
          <InputField 
            type="email" 
            placeholder="Email address" 
            icon={<EmailIcon />} 
          />
          <InputField 
            type="text" 
            placeholder="Username" 
            icon={<UserNameIcon />} 
          />
          <InputField 
            type="password" 
            placeholder="Enter Password" 
            icon={<EyeIcon />} 
          />
          <InputField 
            type="password" 
            placeholder="Re-enter Password" 
            icon={<EyeIcon />} 
          />
        </div>

        {/* --- Footer Section --- */}
        <div className="w-full flex flex-col items-center gap-4">
          <button onClick={registerUser} className="w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200">
            Register
          </button>

          <GoogleSignUp />

          <p className="text-gray-500 font-medium text-center">
            Already have an account ? <a href="/login" className="text-[#1581BF] font-bold hover:underline">Log In</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Signup;