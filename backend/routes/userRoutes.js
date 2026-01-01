import { Router } from "express";
import {
    registerUser,
    loginUser,
    userTouserPayment,
    getRecentContacts,
    getRecentTransactions,
    searchContacts,
} from "../controllers/userController.js";
import { jwtAuth } from "../middleware/auth.js";

const userRouter = Router();

// Public routes
userRouter.post("/signup", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/recent-contacts", jwtAuth, getRecentContacts);
userRouter.get("/search-contacts", jwtAuth, searchContacts);
userRouter.get("/recent-transactions", jwtAuth, getRecentTransactions);
userRouter.post("/pay-user", jwtAuth, userTouserPayment);

export default userRouter;
