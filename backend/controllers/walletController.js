import pool from "../db.js";
import stripe from "../config/stripe.js";

/**
 * Create a Stripe PaymentIntent to add money to wallet
 */
export const createAddMoneyIntent = async (req, res) => {
    try {
        const userId = req.user_id;
        const { amount } = req.body; // Amount in rupees

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount",
            });
        }

        const amountPaise = Math.round(amount * 100);

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountPaise,
            currency: "inr",
            payment_method_types: ["card"],
            metadata: {
                user_id: userId,
                transaction_type: "ADD_MONEY",
            },
        });

        // Create wallet transaction record with PENDING status
        const transactionResult = await pool.query(
            `INSERT INTO wallet_transactions 
            (user_id, transaction_type, amount_paise, status, stripe_payment_intent_id, metadata) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [
                userId,
                "ADD_MONEY",
                amountPaise,
                "PENDING",
                paymentIntent.id,
                JSON.stringify({ created_via: "api" }),
            ]
        );

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            walletTransactionId:
                transactionResult.rows[0].wallet_transaction_id,
        });
    } catch (err) {
        console.error("Error creating add money intent:", err);
        return res.status(500).json({
            success: false,
            message: "Error creating payment intent",
            error: err.message,
        });
    }
};

/**
 * Confirm add money transaction after successful Stripe payment
 * This should be called from webhook in production, but for demo we allow manual confirmation
 */
export const confirmAddMoney = async (req, res) => {
    const client = await pool.connect();

    try {
        const { paymentIntentId, demoMode } = req.body;
        const userId = req.user_id;

        // For demo mode, skip Stripe verification
        // In production, always verify with Stripe
        if (!demoMode) {
            const paymentIntent =
                await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status !== "succeeded") {
                return res.status(400).json({
                    success: false,
                    message: "Payment not successful",
                });
            }
        }

        // Begin transaction
        await client.query("BEGIN");

        // Get wallet transaction
        const transactionResult = await client.query(
            `SELECT * FROM wallet_transactions 
            WHERE stripe_payment_intent_id = $1 AND user_id = $2`,
            [paymentIntentId, userId]
        );

        if (transactionResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        const transaction = transactionResult.rows[0];

        if (transaction.status === "SUCCESS") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Transaction already processed",
            });
        }

        // Update transaction status
        await client.query(
            `UPDATE wallet_transactions 
            SET status = 'SUCCESS', updated_at = CURRENT_TIMESTAMP 
            WHERE wallet_transaction_id = $1`,
            [transaction.wallet_transaction_id]
        );

        // Update wallet balance
        await client.query(
            `UPDATE wallet_accounts 
            SET balance_cached = balance_cached + $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2`,
            [transaction.amount_paise, userId]
        );

        // Commit transaction
        await client.query("COMMIT");

        // Get updated balance
        const walletResult = await pool.query(
            "SELECT balance_cached FROM wallet_accounts WHERE user_id = $1",
            [userId]
        );

        console.log("Successfully");

        return res.status(200).json({
            success: true,
            message: "Money added successfully",
            newBalance: walletResult.rows[0].balance_cached,
            newBalanceInRupees: (
                walletResult.rows[0].balance_cached / 100
            ).toFixed(2),
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error confirming add money:", err);
        return res.status(500).json({
            success: false,
            message: "Error confirming transaction",
            error: err.message,
        });
    } finally {
        client.release();
    }
};

/**
 * Get user's add money transactions (for selecting which one to refund)
 */
export const getAddMoneyTransactions = async (req, res) => {
    try {
        const userId = req.user_id;

        const transactionsResult = await pool.query(
            `SELECT wallet_transaction_id, amount_paise, stripe_payment_intent_id, 
            created_at, status 
            FROM wallet_transactions 
            WHERE user_id = $1 AND transaction_type = 'ADD_MONEY' AND status = 'SUCCESS'
            ORDER BY created_at DESC`,
            [userId]
        );

        const transactions = transactionsResult.rows.map((tx) => ({
            ...tx,
            amountInRupees: (tx.amount_paise / 100).toFixed(2),
        }));

        return res.status(200).json({
            success: true,
            transactions,
        });
    } catch (err) {
        console.error("Error fetching transactions:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching transactions",
            error: err.message,
        });
    }
};

/**
 * Withdraw money from wallet (via Stripe refund - DEMO ONLY)
 * Supports withdrawing any amount <= wallet balance by combining multiple transactions
 */
export const withdrawMoney = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user_id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount",
            });
        }

        const amountPaise = Math.round(amount * 100);

        // Begin transaction
        await client.query("BEGIN");

        // Get wallet balance
        const walletResult = await client.query(
            "SELECT balance_cached FROM wallet_accounts WHERE user_id = $1",
            [userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        const currentBalance = walletResult.rows[0].balance_cached;

        // Check if user has sufficient balance
        if (currentBalance < amountPaise) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Insufficient balance",
            });
        }

        // Get all successful add money transactions, ordered by amount (largest first)
        const transactionsResult = await client.query(
            `SELECT wallet_transaction_id, amount_paise, stripe_payment_intent_id
            FROM wallet_transactions 
            WHERE user_id = $1 AND transaction_type = 'ADD_MONEY' AND status = 'SUCCESS'
            ORDER BY amount_paise DESC, created_at DESC`,
            [userId]
        );

        if (transactionsResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "No transactions available for withdrawal",
            });
        }

        // Find transactions to refund (greedy algorithm - use largest first)
        let remainingAmount = amountPaise;
        const transactionsToRefund = [];

        for (const tx of transactionsResult.rows) {
            if (remainingAmount <= 0) break;

            const refundAmount = Math.min(remainingAmount, tx.amount_paise);
            transactionsToRefund.push({
                paymentIntentId: tx.stripe_payment_intent_id,
                refundAmount: refundAmount,
                originalAmount: tx.amount_paise,
            });
            remainingAmount -= refundAmount;
        }

        if (remainingAmount > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message:
                    "Unable to process withdrawal from available transactions",
            });
        }

        // Create Stripe refunds for each transaction
        const refunds = [];
        for (const tx of transactionsToRefund) {
            const refund = await stripe.refunds.create({
                payment_intent: tx.paymentIntentId,
                amount: tx.refundAmount,
            });
            refunds.push({
                refundId: refund.id,
                paymentIntentId: tx.paymentIntentId,
                amount: tx.refundAmount,
            });
        }

        // Create withdrawal transaction records
        for (const refund of refunds) {
            await client.query(
                `INSERT INTO wallet_transactions 
                (user_id, transaction_type, amount_paise, status, stripe_payment_intent_id, stripe_refund_id, metadata) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    userId,
                    "WITHDRAW",
                    refund.amount,
                    "SUCCESS",
                    refund.paymentIntentId,
                    refund.refundId,
                    JSON.stringify({
                        refund_count: refunds.length,
                        total_withdrawal: amountPaise,
                    }),
                ]
            );
        }

        // Update wallet balance
        await client.query(
            `UPDATE wallet_accounts 
            SET balance_cached = balance_cached - $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2`,
            [amountPaise, userId]
        );

        // Commit transaction
        await client.query("COMMIT");

        // Get updated balance
        const updatedWalletResult = await pool.query(
            "SELECT balance_cached FROM wallet_accounts WHERE user_id = $1",
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Money withdrawn successfully",
            refunds: refunds.map((r) => r.refundId),
            transactionsUsed: refunds.length,
            newBalance: updatedWalletResult.rows[0].balance_cached,
            newBalanceInRupees: (
                updatedWalletResult.rows[0].balance_cached / 100
            ).toFixed(2),
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error withdrawing money:", err);
        return res.status(500).json({
            success: false,
            message: "Error withdrawing money",
            error: err.message,
        });
    } finally {
        client.release();
    }
};

/**
 * Get all wallet transactions (add money + withdrawals)
 */
export const getAllWalletTransactions = async (req, res) => {
    try {
        const userId = req.user_id;

        const transactionsResult = await pool.query(
            `SELECT wallet_transaction_id, transaction_type, amount_paise, status, 
            stripe_payment_intent_id, stripe_refund_id, created_at 
            FROM wallet_transactions 
            WHERE user_id = $1 
            ORDER BY created_at DESC`,
            [userId]
        );

        const transactions = transactionsResult.rows.map((tx) => ({
            ...tx,
            amountInRupees: (tx.amount_paise / 100).toFixed(2),
        }));

        return res.status(200).json({
            success: true,
            transactions,
        });
    } catch (err) {
        console.error("Error fetching wallet transactions:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching transactions",
            error: err.message,
        });
    }
};
