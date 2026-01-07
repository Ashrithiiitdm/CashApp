import express from "express";
import "dotenv/config";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import qrRouter from "./routes/qrRoutes.js";
import storeRouter from "./routes/storeRoutes.js";
import walletRouter from "./routes/walletRoutes.js";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173"];

const app = express();

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true);

            const allowed = ALLOWED_ORIGINS.some((allowedOrigin) =>
                origin.startsWith(allowedOrigin)
            );

            callback(null, allowed);
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// app.options("/*", cors());

app.use(express.json());

app.get("/", (req, res) => {
    return res.send("API is running...");
});

app.use("/api/users", userRouter);
app.use("/api/qr", qrRouter);
app.use("/api/stores", storeRouter);
app.use("/api/wallet", walletRouter);

export default app;
