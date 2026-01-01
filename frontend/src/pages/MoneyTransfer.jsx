import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import axios from "../config/axiosConfig";
import { v4 as uuidv4 } from "uuid";
import {
    ArrowBackIcon,
    UserNameIcon,
    SearchStoresIcon,
} from "../components/Icons";

const MoneyTransfer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const contact = location.state?.contact;
    const prefilledAmount = location.state?.prefilledAmount;
    const isPaymentFlow = location.state?.isPaymentFlow;

    // 🔑 Correct store usage
    const { wallet, setWallet, token } = useAuthStore();

    // If prefilledAmount exists, use it; otherwise default to empty string
    const [amount, setAmount] = useState(
        prefilledAmount ? prefilledAmount.toString() : ""
    );
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Prevent direct access
    if (!contact) {
        navigate("/paypeople");
        return null;
    }

    const handleStorePay = async (idempotencyKey) => {
        try {
            const response = await axios.post(
                `/api/users/pay-store`,
                {
                    store_id: contact.store_id || contact.id,
                    amount_paise: Math.round(parseFloat(amount) * 100),
                    idempotency_key: idempotencyKey,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = response.data;

            return result;
        } catch (err) {
            console.error("Store payment error:", err);
            throw err;
        }
    };

    const handleUserPay = async (idempotencyKey) => {
        try {
            const response = await axios.post(
                `/api/users/pay-user`,
                {
                    to_user_id: contact.user_id || contact.id,
                    amount_paise: Math.round(parseFloat(amount) * 100),
                    idempotency_key: idempotencyKey,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = response.data;

            return result;
        } catch (err) {
            console.error("User payment error:", err);
            throw err;
        }
    };

    const handlePay = async () => {
        const value = parseFloat(amount);

        if (!value || value <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (value > wallet) {
            setError("Insufficient balance");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const idempotencyKey = uuidv4();

            let result = null;

            if (contact.type === "store") {
                result = await handleStorePay(idempotencyKey);
            } else {
                result = await handleUserPay(idempotencyKey);
            }

            // const paymentData = {
            //     to_user_id: contact.id, // from recent/search
            //     amount_paise: Math.round(value * 100),
            //     idempotency_key: idempotencyKey,
            // };

            // const response = await axios.post(
            //     "/api/users/pay-user",
            //     paymentData,
            //     {
            //         headers: {
            //             Authorization: `Bearer ${token}`,
            //         },
            //     }
            // );

            // const result = response.data;

            if (!result.success) {
                console.error("Payment failed:", result.message);
                setError("Payment failed. Please try again.");
                return;
            }

            // ✅ Correct wallet update (backend is source of truth)
            if (typeof result.wallet_balance_paise === "number") {
                console.log("Caame in number if");
                setWallet(result.wallet_balance_paise / 100);
            }

            // --- ✨ UPDATE START: Prepare Data for Success Page ---
            const transactionDetails = {
                amount: value,
                contact: contact,
                // Use backend ID if available, otherwise generate a short one for UI
                transactionId:
                    result.transaction_id ||
                    "TXN" + uuidv4().slice(0, 8).toUpperCase(),
                time: new Date().toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                }),
            };

            // Navigate to Success Page with data
            navigate("/payment-success", { state: transactionDetails });
            // --- ✨ UPDATE END ---
        } catch (err) {
            console.error("Payment error:", err);
            setError("Payment failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
                        {contact.type === "store" ? (
                            <SearchStoresIcon />
                        ) : (
                            <UserNameIcon />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {contact.name}
                    </h2>

                    <p className="text-sm text-gray-500 font-medium mb-1">
                        Paying to {contact.type === "store" ? "Store" : "User"}
                    </p>

                    <div className="mt-2 bg-[#eef7ee] border border-[#dcf0dc] px-4 py-1.5 rounded-full">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide mr-2">
                            Available:
                        </span>
                        <span className="text-[#36a736] font-bold text-sm">
                            ₹ {Number(wallet || 0).toFixed(2)}
                        </span>
                    </div>
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
                                readOnly={!!isPaymentFlow} // Make read-only if flow is fixed
                                onChange={(e) => {
                                    if (!isPaymentFlow) {
                                        // Only allow edit if not payment flow
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
                            placeholder="Add a note (optional)"
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
                        {isLoading ? "Processing..." : "Pay Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoneyTransfer;
