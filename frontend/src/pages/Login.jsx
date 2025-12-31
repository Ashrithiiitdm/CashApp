import InputField from '../components/InputField'; // Adjust path based on your folder structure
import { EyeIcon, LogoIcon, UserNameIcon } from '../components/Icons'; // Adjust path based on your folder structure
import GoogleSignUp from '../components/GoogleSignUp';

const Login = () => {
  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Main Card */}
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl px-8 py-12 flex flex-col items-center relative justify-start gap-y-8">
        
        {/* --- Header Section --- */}
        <div className="w-full flex flex-col items-start pl-2">
          <div className="flex items-center gap-3 mb-12">
            <LogoIcon />
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">CashPay</h1>
          </div>
        </div>

        {/* --- Form Section --- */}
        <div className="w-full flex flex-col gap-4 mb-12">
          <InputField 
            type="text" 
            placeholder="Username / Email" 
            icon={<UserNameIcon />} 
          />
          <InputField 
            type="password" 
            placeholder="Enter Password" 
            icon={<EyeIcon />} 
          />
        </div>

        {/* --- Footer Section --- */}
        <div className="w-full flex flex-col items-center gap-8">
          <button className="w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200">
            Login
          </button>

          <GoogleSignUp />

          <p className="text-gray-500 font-medium text-center">
            Don't have an account ? <a href="/signup" className="text-[#1581BF] font-bold hover:underline">Sign Up</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;