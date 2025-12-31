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

        // Create a cashapp id similar to Phonepe's upi id
        const cashappId =
            email.split("@")[0] +
            Math.floor(Math.random() * 10000) +
            ".cashapp";

        // Store user in your database (without password since Firebase handles it)
        const newUserResult = await pool.query(
            "INSERT INTO users (firebase_uid, email, role, cashapp_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [firebaseUser.uid, email, role, cashappId]
        );

        // Create wallet account with 0 balance
        await pool.query(
            "INSERT INTO wallet_accounts (user_id, balance_cached) VALUES ($1, $2)",
            [newUserResult.rows[0].user_id, 0]
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
            const validRoles = ["user", "vendor", "employee", "admin"];
            if (!validRoles.includes(userRole)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
                });
            }

            const cashappId =
                email.split("@")[0] +
                Math.floor(Math.random() * 10000) +
                ".cashapp";

            userResult = await pool.query(
                "INSERT INTO users (firebase_uid, email, role, cashapp_id) VALUES ($1, $2, $3, $4) RETURNING *",
                [firebase_uid, email, userRole, cashappId]
            );

            // Create wallet account with 0 balance
            await pool.query(
                "INSERT INTO wallet_accounts (user_id, balance_cached) VALUES ($1, $2)",
                [userResult.rows[0].user_id, 0]
            );
        }
        // If user exists, ignore the role parameter

        const user = userResult.rows[0];

        // Return the name of the user, wallet balance
        const walletResult = await pool.query(
            "SELECT balance_cached FROM wallet_accounts WHERE user_id = $1",
            [user.user_id]
        );

        // 4. Generate your own JWT token
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign({ user_id: user.user_id }, jwtSecret, {
            expiresIn: "7d",
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: token,
            user: {
                user_id: user.user_id,
                role: user.role,
                name: user.full_name,
                wallet_balance: walletResult.rows.length
                    ? walletResult.rows[0].balance_cached
                    : 0,
                cashappId: user.cashapp_id,
            },
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

export const getRecentTransactions = async (req, res) => {
    try {
        const user_id = req.user_id;
        const search = req.query.search?.trim();

        let query = `
            SELECT
                T.transaction_id,
                T.transaction_kind,
                T.transaction_status,
                T.amount_paise,
                T.currency,
                T.created_at,

                -- user ↔ user
                U2.user_id       AS peer_user_id,
                U2.full_name     AS peer_name,
                U2.cashapp_id    AS peer_cashapp_id,

                -- user → store
                S.store_id,
                S.store_name

            FROM transactions T

            -- peer user (only when user ↔ user)
            LEFT JOIN users U2
              ON (
                   (T.from_user_id = $1 AND U2.user_id = T.to_user_id)
                OR (T.to_user_id   = $1 AND U2.user_id = T.from_user_id)
              )

            -- store (only when user → store)
            LEFT JOIN stores S
              ON S.store_id = T.store_id

            WHERE
                T.from_user_id = $1
             OR T.to_user_id   = $1
        `;

        const params = [user_id];

        // 🔍 Optional search (name or cashapp_id)
        if (search) {
            query += `
                AND (
                    U2.full_name ILIKE $2
                 OR U2.cashapp_id ILIKE $2
                 OR S.store_name ILIKE $2
                )
            `;
            params.push(`%${search}%`);
        }

        query += `
            ORDER BY T.created_at DESC
            LIMIT 20
        `;

        const { rows } = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            recent_transactions: rows.length ? rows : [],
        });
    } catch (err) {
        console.error("Error fetching recent transactions:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching recent transactions",
        });
    }
};
