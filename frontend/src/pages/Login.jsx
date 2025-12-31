import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; // Ensure path is correct
import InputField from '../components/InputField';
import { EyeIcon, LogoIcon, UserNameIcon } from '../components/Icons';
import GoogleSignUp from '../components/GoogleSignUp';

const Login = () => {
  // 1. Local state for form inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // 2. Hooks for navigation and global state
  const navigate = useNavigate();
  const { login, setLoading, setError, isLoading, error } = useAuthStore();

  // 3. Login Handler
  const handleLogin = async (e) => {
    // Prevent default if wrapped in form, otherwise good practice
    if (e) e.preventDefault();

    // Basic Validation
    if (!identifier || !password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      // --- SIMULATE API CALL ---
      // In real app: const res = await axios.post('/api/login', { identifier, password });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock Data (Replace with real response data)
      const mockUser = { 
        id: 'user_123', 
        name: 'CashPay User', 
        email: identifier 
      };
      const mockToken = 'jwt_token_example_123';

      // Update Zustand Store
      login(mockUser, mockToken);

      // Navigate to Home
      navigate('/home');

    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Wrapped in form to allow "Enter" key submission */}
        <form className="w-full flex flex-col gap-4 mb-8" onSubmit={handleLogin}>
          
          {/* Error Message Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm text-center">
              {error}
            </div>
          )}

          <InputField 
            type="text" 
            placeholder="Username / Email" 
            icon={<UserNameIcon />}
            // Connect to state
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          
          <InputField 
            type="password" 
            placeholder="Enter Password" 
            icon={<EyeIcon />}
            // Connect to state
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Moved Button inside form for submit behavior */}
          <div className="w-full flex flex-col items-center gap-8 mt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px] shadow-lg 
                transition-all duration-200 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98]'}
              `}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        {/* --- Footer Section --- */}
        <div className="w-full flex flex-col items-center gap-8">
          
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