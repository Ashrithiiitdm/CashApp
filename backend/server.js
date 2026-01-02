import express from "express";
import "dotenv/config";
import cors from "cors";
import pool from "./db.js";
import userRouter from "./routes/userRoutes.js";
import qrRouter from "./routes/qrRoutes.js";
import storeRouter from "./routes/storeRoutes.js";

const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use("/api/users", userRouter);
app.use("/api/qr", qrRouter);
app.use("/api/stores", storeRouter);

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
