import "dotenv/config";
import pool from "./db.js";
import app from "./app.js";

const port = process.env.PORT || 8000;

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
