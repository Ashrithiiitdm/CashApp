import express from "express";
import "dotenv/config";
import cors from "cors";
import pool from "./db.js";
import userRouter from "./routes/userRoutes.js";
import qrRouter from "./routes/qrRoutes.js";
import storeRouter from "./routes/storeRoutes.js";
import walletRouter from "./routes/walletRoutes.js";

const port = process.env.PORT || 8000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173'];

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true);
            
            if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use("/api/users", userRouter);
app.use("/api/qr", qrRouter);
app.use("/api/stores", storeRouter);
app.use("/api/wallet", walletRouter);

async function startServer() {
    try {
        await pool.query("SELECT 1");
        console.log("Connected to PostgreSQL database");

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error("Failed to connect to the database:", err);
        process.exit(1);
    }
}

startServer();
