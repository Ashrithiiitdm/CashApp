import React, { useState } from "react";
import InputField from "../components/InputField"; // Adjust path based on your folder structure
import { EyeIcon, LogoIcon, EmailIcon } from "../components/Icons"; // Adjust path based on your folder structure
import GoogleSignUp from "../components/GoogleSignUp";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import axios from "../config/axiosConfig"

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.email || !formData.password) {
            setError("Email and password are required");
            return;
        }

        setLoading(true);

        try {
            // 1. Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // 2. Get Firebase ID token
            const idToken = await userCredential.user.getIdToken();

            const response = await axios.post("/api/users/login", {
                idToken,
            });
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || "Login failed");
            }

            // 4. Store token and user info
            localStorage.setItem("token", data.token);
            // localStorage.setItem("user", JSON.stringify(data.user));

            // 5. Redirect to home or dashboard
            alert("Login successful!");
            window.location.href = "/home";
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
            {/* Main Card */}
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl px-8 py-12 flex flex-col items-center relative justify-start gap-y-8">
                {/* --- Header Section --- */}
                <div className="w-full flex flex-col items-start pl-2">
                    <div className="flex items-center gap-3 mb-12">
                        <LogoIcon />
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                            CashPay
                        </h1>
                    </div>
                </div>

                {/* --- Form Section --- */}
                <form
                    onSubmit={onSubmit}
                    className="w-full flex flex-col gap-4 mb-12"
                >
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <InputField
                        type="email"
                        placeholder="Email"
                        icon={<EmailIcon />}
                        value={formData.email}
                        onChange={(e) =>
                            handleInputChange("email", e.target.value)
                        }
                        disabled={loading}
                    />
                    <InputField
                        type="password"
                        placeholder="Enter Password"
                        icon={<EyeIcon />}
                        value={formData.password}
                        onChange={(e) =>
                            handleInputChange("password", e.target.value)
                        }
                        disabled={loading}
                    />
                </form>

                {/* --- Footer Section --- */}
                <div className="w-full flex flex-col items-center gap-8">
                    <button
                        type="submit"
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <GoogleSignUp activeTab="User" />

                    <p className="text-gray-500 font-medium text-center">
                        Don't have an account ?{" "}
                        <a
                            href="/signup"
                            className="text-[#1581BF] font-bold hover:underline"
                        >
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
