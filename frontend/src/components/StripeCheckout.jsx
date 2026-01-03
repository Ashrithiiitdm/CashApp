import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "../config/axiosConfig";
import { useAuthStore } from "../store/useAuthStore";

// Initialize Stripe with your publishable key
// Make sure to add VITE_STRIPE_PUBLISHABLE_KEY to your .env file
const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

const StripeCheckoutForm = ({ amount, onSuccess, onCancel }) => {
    const { token } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    const handlePayment = async () => {
        try {
            setIsProcessing(true);
            setError("");

            // Create payment intent
            const response = await axios.post(
                "/api/wallet/add-money/create-intent",
                { amount: parseFloat(amount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { clientSecret, paymentIntentId } = response.data;

            // In a real app, you would use Stripe Elements to collect card info
            // For demo purposes, we'll simulate this with test mode
            // Assuming payment succeeds immediately in test mode

            // Confirm the payment (demo mode = skip Stripe verification)
            const confirmResponse = await axios.post(
                "/api/wallet/add-money/confirm",
                { paymentIntentId, demoMode: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (confirmResponse.data.success) {
                onSuccess({
                    success: true,
                    transaction_id: paymentIntentId,
                    newBalance: confirmResponse.data.newBalance,
                });
            } else {
                setError("Payment confirmation failed");
            }
        } catch (err) {
            console.error("Payment error:", err);
            setError(
                err.response?.data?.message ||
                    "Payment failed. Please try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                    <strong>Demo Mode:</strong> Using Stripe test mode
                </p>
                <p className="text-xs text-gray-600">
                    In production, you would enter card details here. For this
                    demo, payment will be simulated automatically.
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-[#1581BF] text-white py-3 rounded-xl font-semibold hover:bg-[#0D6A9F] transition-colors disabled:opacity-50"
                >
                    {isProcessing ? "Processing..." : `Pay ₹${amount}`}
                </button>
            </div>
        </div>
    );
};

export const StripeCheckout = ({ amount, onSuccess, onCancel }) => {
    return (
        <Elements stripe={stripePromise}>
            <StripeCheckoutForm
                amount={amount}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </Elements>
    );
};
