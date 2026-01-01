import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../config/firebase";
import axios from "../config/axiosConfig";

import { useAuthStore } from "../store/useAuthStore";
import InputField from "../components/InputField";
import { EyeIcon, LogoIcon, EmailIcon } from "../components/Icons";
import GoogleSignUp from "../components/GoogleSignUp";

const Login = () => {
  const navigate = useNavigate();

  // Zustand store
  const { login, setLoading, setError, isLoading, error } = useAuthStore();

  // Local form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      // 1. Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // 3. Backend login
      const response = await axios.post("/api/users/login", { idToken });
      const data = response.data;

      // --- DEBUGGING LOGS (Check your Console!) ---
      console.log("Backend Full Response:", data);
      console.log("User Data:", data.user);
      console.log("Wallet Data:", data.wallet);

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      console.log("User:", data.user);

      

      // 4. Update Zustand store
      login(data.user, data.token);

      // 5. Redirect
      navigate("/home");

    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl px-8 py-12 flex flex-col items-center gap-y-8">
        {/* Header */}
        <div className="w-full flex items-start pl-2">
          <div className="flex items-center gap-3 mb-12">
            <LogoIcon />
            <h1 className="text-5xl font-bold text-gray-900">CashPay</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 mb-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <InputField
            type="email"
            placeholder="Email"
            icon={<EmailIcon />}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={isLoading}
          />

          <InputField
            type="password"
            placeholder="Enter Password"
            icon={<EyeIcon />}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px]
              transition-all duration-200
              ${
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98]"
              }
            `}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="w-full flex flex-col items-center gap-8">
          <GoogleSignUp activeTab="User" />

          <p className="text-gray-500 font-medium text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-[#1581BF] font-bold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
