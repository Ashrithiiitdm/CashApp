import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import axios from "../config/axiosConfig";
import { v4 as uuidv4 } from "uuid";
import {
    ArrowBackIcon,
    UserNameIcon,
    SearchStoresIcon,
    WalletIcon, // Assumed available, or reuse another icon
    WithdrawIcon, // Assumed available, or reuse another icon
} from "../components/Icons";

const MoneyTransfer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const contact = location.state?.contact;
    const prefilledAmount = location.state?.prefilledAmount;
    const isPaymentFlow = location.state?.isPaymentFlow;
    const cartItems = location.state?.cartItems;

    const { wallet, setWallet, token } = useAuthStore();
    const { clearCart } = useCartStore();

    // Determine Mode
    const isAddMoney = contact?.type === "add-money";
    const isWithdraw = contact?.type === "withdraw";

    const [amount, setAmount] = useState(
        prefilledAmount ? prefilledAmount.toString() : ""
    );
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!contact) {
        navigate("/paypeople");
        return null;
    }

    // --- API Handlers (Existing) ---
    const handleStorePay = async (idempotencyKey) => {
        const response = await axios.post(
            `/api/users/pay-store`,
            {
                store_id: contact.store_id || contact.id,
                amount_paise: Math.round(parseFloat(amount) * 100),
                idempotency_key: idempotencyKey,
                metadata: cartItems ? { items: cartItems } : {},
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    };

    const handleUserPay = async (idempotencyKey) => {
        const response = await axios.post(
            `/api/users/pay-user`,
            {
                to_user_id: contact.user_id || contact.id,
                amount_paise: Math.round(parseFloat(amount) * 100),
                idempotency_key: idempotencyKey,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    };

    // --- New Handlers for Add/Withdraw ---
    const processAddMoney = async (value) => {
        // 1. Simulate Payment Gateway Opening
        const confirmed = window.confirm(
            `Redirecting to Payment Gateway...\n\nPay ₹${value} via UPI/Card?`
        );
        
        if (!confirmed) throw new Error("Transaction Cancelled by User");

        // 2. Simulate API Delay & Success
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Update Local State (Since we might not have a backend endpoint yet)
        // In a real app, you would call: await axios.post('/api/wallet/add', ...)
        const newBalance = wallet + value;
        setWallet(newBalance);

        return {
            success: true,
            transaction_id: "ADD-" + uuidv4().slice(0, 8).toUpperCase(),
            // Mocking the backend response structure
        };
    };

    const processWithdraw = async (value) => {
        // 1. Simulate Bank Details Collection
        const details = window.prompt(
            "Enter Bank Account Number or UPI ID for withdrawal:"
        );

        if (!details) throw new Error("Bank details are required");

        // 2. Simulate Processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Update Local State
        // In a real app: await axios.post('/api/wallet/withdraw', { details, ... })
        const newBalance = wallet - value;
        setWallet(newBalance);

        return {
            success: true,
            transaction_id: "WDR-" + uuidv4().slice(0, 8).toUpperCase(),
        };
    };

    const handlePay = async () => {
        const value = parseFloat(amount);

        if (!value || value <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        // Only check wallet balance if NOT adding money
        if (!isAddMoney && value > wallet) {
            setError("Insufficient balance");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const idempotencyKey = uuidv4();
            let result = null;

            // --- BRANCHING LOGIC ---
            if (isAddMoney) {
                result = await processAddMoney(value);
            } else if (isWithdraw) {
                result = await processWithdraw(value);
            } else if (contact.type === "store") {
                result = await handleStorePay(idempotencyKey);
            } else {
                result = await handleUserPay(idempotencyKey);
            }

            // Handle API Failures
            if (!result.success) {
                console.error("Payment failed:", result.message);
                setError(result.message || "Payment failed. Please try again.");
                return;
            }

            // Update Wallet from Backend Response (if available for standard transfers)
            if (typeof result.wallet_balance_paise === "number") {
                setWallet(result.wallet_balance_paise / 100);
            }
            
            if (contact.type === "store") {
                clearCart();
            }

            // Prepare Success Data
            const transactionDetails = {
                amount: value,
                contact: contact,
                transactionId: result.transaction_id || "TXN" + uuidv4().slice(0, 8).toUpperCase(),
                time: new Date().toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                }),
                // Add a flag to customize success message if needed
                type: isAddMoney ? 'Credit' : 'Debit' 
            };

            navigate("/payment-success", { state: transactionDetails });

        } catch (err) {
            console.error("Payment error:", err);
            // Don't show "Payment failed" if user just cancelled the prompt
            if (err.message !== "Transaction Cancelled by User" && err.message !== "Bank details are required") {
                 setError("Transaction failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper for Header Text
    const getHeaderText = () => {
        if (isAddMoney) return "Add Money to Wallet";
        if (isWithdraw) return "Withdraw to Bank";
        return `Paying to ${contact.type === "store" ? "Store" : "User"}`;
    };

    const getButtonText = () => {
        if (isLoading) return "Processing...";
        if (isAddMoney) return "Add Money";
        if (isWithdraw) return "Withdraw Money";
        return "Pay Now";
    };

    // Helper for Icon
    const getIcon = () => {
        if (isAddMoney) return <WalletIcon className="text-blue-500" />; // Ensure specific styling if needed
        if (isWithdraw) return <WithdrawIcon className="text-blue-500" />;
        return contact.type === "store" ? <SearchStoresIcon /> : <UserNameIcon />;
    };

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 font-sans">
            <div className="bg-[#f8f9fd] w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="bg-white pt-8 pb-6 px-6 shadow-sm z-10 flex flex-col items-center relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-6 top-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowBackIcon />
                    </button>

                    <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-3 mt-4">
                        {getIcon()}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {contact.name}
                    </h2>

                    <p className="text-sm text-gray-500 font-medium mb-1">
                        {getHeaderText()}
                    </p>

                    {/* Only show "Available Balance" if NOT Adding Money */}
                    {!isAddMoney && (
                        <div className="mt-2 bg-[#eef7ee] border border-[#dcf0dc] px-4 py-1.5 rounded-full">
                            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide mr-2">
                                Available:
                            </span>
                            <span className="text-[#36a736] font-bold text-sm">
                                ₹ {Number(wallet || 0).toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center px-8 py-6 space-y-8">
                    <div className="w-full">
                        <label className="block text-center text-gray-500 text-sm font-bold mb-4 uppercase tracking-wider">
                            Enter Amount
                        </label>

                        <div className="relative flex justify-center items-center p-2">
                            <span className="absolute left-8 text-4xl font-bold text-gray-400">
                                ₹
                            </span>
                            <input
                                type="number"
                                value={amount}
                                readOnly={!!isPaymentFlow}
                                onChange={(e) => {
                                    if (!isPaymentFlow) {
                                        setAmount(e.target.value);
                                        setError("");
                                    }
                                }}
                                placeholder="0"
                                className={`w-full text-center text-4xl font-bold py-6 pr-3 rounded-3xl border-2 border-transparent focus:border-blue-400 outline-none transition-all placeholder-gray-200 
                ${isPaymentFlow ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "bg-white text-gray-800"}`}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center mt-2 font-medium">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="w-full">
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={isWithdraw ? "Reason (Optional)" : "Add a note (optional)"}
                            className="w-full bg-white text-center py-4 rounded-2xl border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-400 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-[#f8f9fd]">
                    <button
                        onClick={handlePay}
                        disabled={isLoading}
                        className="w-full bg-[#1581BF] text-white text-xl font-bold py-4 rounded-[25px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200"
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoneyTransfer;