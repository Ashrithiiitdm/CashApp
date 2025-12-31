import pool from "../db";
import { v2 as cloudinary } from "cloudinary";

export const updateDetails = async (req, res) => {
    try {
        const { name, age, sex, phone_no, experience } = req.query;
        const user_id = req.user_id;

        const profilePic = req.file ? req.file.path : null;

        let imageUrl = await cloudinary.uploader.upload(profilePic, {
            resource_type: "image",
        });

        await pool.query(
            `
                INSERT INTO Employees (user_id, full_name, age, sex, phone_no, experience, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [user_id, name, age, sex, phone_no, experience, imageUrl.secure_url]
        );

        return res.status(201).json({
            success: true,
            message: "Details saved successfully",
        });
    } catch (err) {
        console.error("Error updating employees:", err);
        return res.status(500).json({
            success: false,
            message: "Error updating data",
            error: err.message,
        });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        // Get Name, Cashappid, Phone no, image_url
        const result = await pool.query(
            `
                SELECT E.full_name, U.cashapp_id, E.phone_no, E.image_url
                FROM Employees E
                JOIN Users U ON E.user_id = U.user_id 
            `
        );

        return res.status(200).json({
            success: true,
            employees: result.rowCount ? result.rows : [],
        });
    } catch (err) {
        console.error("Error fetching employees:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching employees",
            error: err.message,
        });
    }
};
