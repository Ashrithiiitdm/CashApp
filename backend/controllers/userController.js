import pool from "../db.js";
import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check if user already exists in your database
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        // Create user in Firebase Authentication
        const firebaseUser = await admin.auth().createUser({
            email: email,
            password: password,
        });

        // Store user in your database (without password since Firebase handles it)
        await pool.query(
            "INSERT INTO users (firebase_uid, email, role) VALUES ($1, $2, $3) RETURNING *",
            [firebaseUser.uid, email, role]
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (err) {
        console.error("Error registering user:", err);

        return res.status(500).json({
            success: false,
            message: "Error registering user",
            error: err.message,
        });
    }
};

// Login: Frontend sends Firebase ID token, backend verifies and issues JWT
// Works for all login methods: email/password, Google, Facebook, etc.
// For Google/social logins, include 'role' in body for first-time users
export const loginUser = async (req, res) => {
    try {
        const { idToken, role } = req.body;

        // 1. Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebase_uid = decodedToken.uid;
        const email = decodedToken.email;

        // 2. Get user from your database
        let userResult = await pool.query(
            "SELECT * FROM users WHERE firebase_uid = $1",
            [firebase_uid]
        );

        // 3. If user doesn't exist, create them (for Google/social logins)
        if (userResult.rows.length === 0) {
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: "Role is required for new users",
                });
            }

            // Use provided role or default to 'student'
            const userRole = role;

            // Validate role
            const validRoles = ["student", "vendor", "employee", "admin"];
            if (!validRoles.includes(userRole)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
                });
            }

            userResult = await pool.query(
                "INSERT INTO users (firebase_uid, email, role) VALUES ($1, $2, $3) RETURNING *",
                [firebase_uid, email, userRole]
            );
        }
        // If user exists, ignore the role parameter

        const user = userResult.rows[0];

        // 4. Generate your own JWT token
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign({ user_id: user.user_id }, jwtSecret, {
            expiresIn: "7d",
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: token,
        });
    } catch (err) {
        console.error("Error logging in user:", err);
        return res.status(500).json({
            success: false,
            message: "Error logging in user",
            error: err.message,
        });
    }
};

// Get current user info (protected route example)
export const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by JWT middleware
        const userResult = await pool.query(
            "SELECT user_id, email, role, firebase_uid FROM users WHERE user_id = $1",
            [req.user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: userResult.rows[0],
        });
    } catch (err) {
        console.error("Error getting current user:", err);
        return res.status(500).json({
            success: false,
            message: "Error getting user",
            error: err.message,
        });
    }
};
