import pool from "../db.js";
import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";
import {
    getAndLockSenderWallet,
    processWalletPayment,
} from "../services/payments.js";

export const registerUser = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

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
            "INSERT INTO users (firebase_uid, email, role, cashapp_id, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [firebaseUser.uid, email, role, cashappId, name]
        );

        // Create wallet account with 0 balance
        await pool.query(
            "INSERT INTO wallet_accounts (user_id, balance_cached) VALUES ($1, $2)",
            [newUserResult.rows[0].user_id, 0]
        );

        // If role is vendor, create vendor record
        if (role === "vendor") {
            const vendorName = name || email.split("@")[0];
            await pool.query(
                "INSERT INTO vendors (vendor_name, owner_user_id) VALUES ($1, $2)",
                [vendorName, newUserResult.rows[0].user_id]
            );
        }

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

            const name = decodedToken.name || "";

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
                "INSERT INTO users (firebase_uid, full_name, email, role, cashapp_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [firebase_uid, name, email, userRole, cashappId]
            );

            // Create wallet account with 0 balance
            await pool.query(
                "INSERT INTO wallet_accounts (user_id, balance_cached) VALUES ($1, $2)",
                [userResult.rows[0].user_id, 0]
            );

            // If role is vendor, create vendor record
            if (userRole === "vendor") {
                await pool.query(
                    "INSERT INTO vendors (vendor_name, owner_user_id) VALUES ($1, $2)",
                    [name, userResult.rows[0].user_id]
                );
            }
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

        // console.log("Balance", walletResult.rows[0].balance_cached);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: token,
            user: {
                user_id: user.user_id,
                role: user.role,
                name: user.full_name,
                wallet_balance: walletResult.rows.length
                    ? Number(walletResult.rows[0].balance_cached)
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
                S.display_name AS store_name

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
                 OR S.display_name ILIKE $2
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

export const getRecentContacts = async (req, res) => {
    try {
        const user_id = req.user_id;

        const query = `
            WITH recent AS (
                SELECT
                    T.created_at,
                    CASE
                        WHEN T.from_user_id = $1 THEN T.to_user_id
                        ELSE T.from_user_id
                    END AS peer_user_id,
                    T.store_id
                FROM transactions T
                WHERE T.from_user_id = $1
                   OR T.to_user_id   = $1
            )
            SELECT DISTINCT ON (contact_id)
                contact_id AS id,
                contact_type AS type,
                contact_name AS name,
                cashapp_id,
                user_id,
                store_id,
                last_interaction_at
            FROM (
                SELECT
                    U.user_id      AS contact_id,
                    'person'       AS contact_type,
                    U.full_name    AS contact_name,
                    U.cashapp_id   AS cashapp_id,
                    U.user_id      AS user_id,
                    NULL::text  AS store_id,
                    R.created_at   AS last_interaction_at
                FROM recent R
                JOIN users U ON U.user_id = R.peer_user_id

                UNION ALL

                SELECT
                    S.store_id     AS contact_id,
                    'store'        AS contact_type,
                    S.display_name AS contact_name,
                    NULL::text     AS cashapp_id,
                    NULL::text  AS user_id,
                    S.store_id     AS store_id,
                    R.created_at   AS last_interaction_at
                FROM recent R
                JOIN stores S ON S.store_id = R.store_id
            ) contacts
            ORDER BY contact_id, last_interaction_at DESC
            LIMIT 20
        `;

        const { rows } = await pool.query(query, [user_id]);

        return res.status(200).json({
            success: true,
            contacts: rows,
        });
    } catch (err) {
        console.error("Error fetching contacts:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching contacts",
        });
    }
};

export const searchContacts = async (req, res) => {
    try {
        const user_id = req.user_id;
        const q = req.query.q?.trim();
        // Safety: minimum length
        if (!q || q.length < 2) {
            return res.status(200).json({
                success: true,
                contacts: [],
            });
        }

        const query = `
            (
                -- Users
                SELECT
                    U.user_id      AS id,
                    'person'       AS type,
                    U.full_name    AS name,
                    U.cashapp_id   AS cashapp_id,
                    U.user_id      AS user_id,
                    NULL::text  AS store_id,
                    NULL           AS last_interaction_at
                FROM users U
                WHERE U.user_id != $1
                  AND (
                        U.full_name ILIKE $2
                     OR U.cashapp_id ILIKE $2
                  )
            )

            UNION ALL

            (
                -- Stores
                SELECT
                    S.store_id     AS id,
                    'store'        AS type,
                    S.display_name AS name,
                    NULL::text     AS cashapp_id,
                    NULL::text  AS user_id,
                    S.store_id     AS store_id,
                    NULL           AS last_interaction_at
                FROM stores S
                WHERE S.display_name ILIKE $2
            )

            LIMIT 20
        `;

        const { rows } = await pool.query(query, [user_id, `%${q}%`]);

        return res.status(200).json({
            success: true,
            contacts: rows,
        });
    } catch (err) {
        console.error("Error searching contacts:", err);
        return res.status(500).json({
            success: false,
            message: "Error searching contacts",
        });
    }
};

export const userTouserPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { to_user_id, amount_paise, idempotency_key } = req.body;
        const from_user_id = req.user_id;

        if (
            !to_user_id ||
            !amount_paise ||
            amount_paise <= 0 ||
            !idempotency_key
        ) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid input" });
        }

        if (to_user_id === from_user_id) {
            return res
                .status(400)
                .json({ success: false, message: "Cannot pay yourself" });
        }

        await client.query("BEGIN");

        // validate recipient user
        const u = await client.query(
            `SELECT user_id FROM users WHERE user_id = $1 AND "isActive" = true`,
            [to_user_id]
        );
        if (!u.rows.length) {
            await client.query("ROLLBACK");
            return res
                .status(404)
                .json({ success: false, message: "Recipient not found" });
        }

        // lock wallets
        const senderWallet = await getAndLockSenderWallet(
            client,
            from_user_id,
            amount_paise
        );

        const receiverWallet = await client.query(
            `
            SELECT wallet_account_id
            FROM wallet_accounts
            WHERE user_id = $1
            FOR UPDATE
            `,
            [to_user_id]
        );

        if (!receiverWallet.rows.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Recipient wallet not found",
            });
        }

        const result = await processWalletPayment({
            client,
            from_user_id,
            to_user_id,
            amount_paise,
            idempotency_key,
            description: "User to user payment",

            debit_wallet_account_id: senderWallet.wallet_account_id,
            credit_account_id: receiverWallet.rows[0].wallet_account_id,
            credit_account_type: "wallet",
        });

        await client.query("COMMIT");

        return res.json({
            success: true,
            transaction_id: result.transaction_id,
            wallet_balance_paise: Number(result.updated_balance),
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: "Payment failed" });
    } finally {
        client.release();
    }
};

export const userToStore = async (req, res) => {
    const client = await pool.connect();

    try {
        const { store_id, amount_paise, idempotency_key } = req.body;
        const from_user_id = req.user_id;

        if (
            !store_id ||
            !amount_paise ||
            amount_paise <= 0 ||
            !idempotency_key
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
            });
        }

        await client.query("BEGIN");

        /* --------------------------------------------------
           1. Validate store + vendor wallet
        -------------------------------------------------- */
        const storeVendorRes = await client.query(
            `
            SELECT
                S.store_id,
                WA.wallet_account_id AS vendor_wallet_id
            FROM stores S
            JOIN vendors V ON V.vendor_id = S.vendor_id
            JOIN wallet_accounts WA ON WA.user_id = V.owner_user_id
            WHERE S.store_id = $1
              AND S.status = 'active'
            FOR UPDATE
            `,
            [store_id]
        );

        if (!storeVendorRes.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Store or vendor wallet not found",
            });
        }

        const vendorWalletId = storeVendorRes.rows[0].vendor_wallet_id;

        /* --------------------------------------------------
           2. Lock sender wallet
        -------------------------------------------------- */
        const senderWallet = await getAndLockSenderWallet(
            client,
            from_user_id,
            amount_paise
        );

        /* --------------------------------------------------
           3. Process payment using generic engine
        -------------------------------------------------- */
        const result = await processWalletPayment({
            client,
            from_user_id,
            amount_paise,
            idempotency_key,
            description: "User to store payment",

            debit_wallet_account_id: senderWallet.wallet_account_id,
            credit_account_id: vendorWalletId,
            credit_account_type: "wallet",

            store_id, // 🔑 keeps store linkage
        });

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            transaction_id: result.transaction_id,
            wallet_balance_paise: Number(result.updated_balance),
        });
    } catch (err) {
        await client.query("ROLLBACK");

        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Duplicate transaction (idempotency key reused)",
            });
        }

        console.error("Error processing user to store payment:", err);

        return res.status(500).json({
            success: false,
            message: "Error processing user to store payment",
        });
    } finally {
        client.release();
    }
};
