import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());

// Connect to MongoDB and start the server
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });
