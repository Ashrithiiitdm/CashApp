import express from "express";
import {
    createAddMoneyIntent,
    confirmAddMoney,
    getAddMoneyTransactions,
    withdrawMoney,
} from "../controllers/walletController.js";
import { jwtAuth } from "../middleware/auth.js";

const router = express.Router();

// Create PaymentIntent for adding money
router.post("/add-money/create-intent", jwtAuth, createAddMoneyIntent);

// Confirm add money transaction after successful payment
router.post("/add-money/confirm", jwtAuth, confirmAddMoney);

// Get all successful add money transactions (for withdrawal selection)
router.get("/add-money/transactions", jwtAuth, getAddMoneyTransactions);

// Withdraw money (Stripe refund)
router.post("/withdraw", jwtAuth, withdrawMoney);

export default router;
