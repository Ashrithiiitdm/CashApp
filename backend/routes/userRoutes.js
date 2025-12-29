import { Router } from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/userController.js";
import { jwtAuth } from "../middleware/auth.js";

const userRouter = Router();

// Public routes
userRouter.post("/signup", registerUser);
userRouter.post("/login", loginUser);

// Protected routes (require JWT token)
userRouter.get("/me", jwtAuth, getCurrentUser);

export default userRouter;
