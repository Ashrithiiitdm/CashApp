import { Router } from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import { jwtAuth } from "../middleware/auth.js";

const userRouter = Router();

// Public routes
userRouter.post("/signup", registerUser);
userRouter.post("/login", loginUser);

// userRouter.get("/")

export default userRouter;
