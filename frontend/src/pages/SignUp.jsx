import { useState } from "react";
import InputField from "../components/InputField"; // Adjust path based on your folder structure
import {
    EyeIcon,
    LogoIcon,
    EmailIcon,
    UserNameIcon,
} from "../components/Icons"; // Adjust path based on your folder structure
import GoogleSignUp from "../components/GoogleSignUp";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";
import axios from "../config/axiosConfig";

const Signup = () => {
    const [activeTab, setActiveTab] = useState("User");
    const tabs = ["User", "Vendor", "Employee"];
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
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
        if (
            !formData.email ||
            !formData.name ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setError("All fields are required");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // Determine role based on active tab
            const role = activeTab.toLowerCase();

            const response = await axios.post("/api/users/signup", {
                email: formData.email,
                password: formData.password,
                role: role,
            });

            if (response.data.success !== true) {
                throw new Error(response.data.message || "Registration failed");
            }

            const firebaseUser = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const idToken = await firebaseUser.user.getIdToken();

            const loginResponse = await axios.post("/api/users/login", {
                idToken,
            });

            if (loginResponse.data.success !== true) {
                throw new Error(
                    loginResponse.data.message ||
                        "Login after registration failed"
                );
            }

            const token = loginResponse.data.token;

            localStorage.setItem("token", token);

            // Success - redirect to login or home
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to register. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto">
            {/* Main Card */}
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl px-8 py-12 flex flex-col items-center relative justify-start">
                {/* --- Header Section --- */}
                <div className="w-full flex flex-col items-start pl-2">
                    <div className="flex items-center gap-3 mb-8">
                        <LogoIcon />
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                            CashPay
                        </h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-8 mb-4 ml-2 w-full justify-start border-b border-gray-200/50 relative">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-lg font-medium transition-colors relative
                  ${activeTab === tab ? "text-[#1581BF]" : "text-gray-400 hover:text-gray-500"}`}
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
                <form
                    onSubmit={onSubmit}
                    className="w-full flex flex-col gap-4 mb-8"
                >
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <InputField
                        type="email"
                        placeholder="Email address"
                        icon={<EmailIcon />}
                        value={formData.email}
                        onChange={(e) =>
                            handleInputChange("email", e.target.value)
                        }
                        disabled={loading}
                    />
                    <InputField
                        type="text"
                        placeholder="Full Name"
                        icon={<UserNameIcon />}
                        value={formData.name}
                        onChange={(e) =>
                            handleInputChange("name", e.target.value)
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
                    <InputField
                        type="password"
                        placeholder="Re-enter Password"
                        icon={<EyeIcon />}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                        }
                        disabled={loading}
                    />
                </form>

                {/* --- Footer Section --- */}
                <div className="w-full flex flex-col items-center gap-4">
                    <button
                        type="submit"
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full bg-[#1581BF] text-white text-xl font-bold py-3 rounded-[20px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                    <GoogleSignUp activeTab={activeTab} />

                    <p className="text-gray-500 font-medium text-center">
                        Already have an account ?{" "}
                        <a
                            href="/login"
                            className="text-[#1581BF] font-bold hover:underline"
                        >
                            Log In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
