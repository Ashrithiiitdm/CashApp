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
            return res.status(400).json({
                success: false,
                message: "Invalid input",
            });
        }

        if (to_user_id === from_user_id) {
            return res.status(400).json({
                success: false,
                message: "Cannot transfer to self",
            });
        }

        await client.query("BEGIN");

        /* --------------------------------------------------
           1. Check recipient user exists
        -------------------------------------------------- */
        const toUserResult = await client.query(
            `SELECT user_id FROM users WHERE user_id = $1 AND "isActive" = true`,
            [to_user_id]
        );

        if (toUserResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Recipient user not found",
            });
        }

        /* --------------------------------------------------
           2. Fetch & lock sender wallet
        -------------------------------------------------- */
        const senderWalletResult = await client.query(
            `
            SELECT wallet_account_id, balance_cached
            FROM wallet_accounts
            WHERE user_id = $1
            FOR UPDATE
            `,
            [from_user_id]
        );

        if (senderWalletResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Sender wallet not found",
            });
        }

        const senderWallet = senderWalletResult.rows[0];

        if (senderWallet.balance_cached < amount_paise) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance",
            });
        }

        /* --------------------------------------------------
           3. Fetch & lock receiver wallet
        -------------------------------------------------- */
        const receiverWalletResult = await client.query(
            `
            SELECT wallet_account_id
            FROM wallet_accounts
            WHERE user_id = $1
            FOR UPDATE
            `,
            [to_user_id]
        );

        if (receiverWalletResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Recipient wallet not found",
            });
        }

        const receiverWallet = receiverWalletResult.rows[0];

        /* --------------------------------------------------
           4. Create transaction (idempotent)
        -------------------------------------------------- */
        const transactionResult = await client.query(
            `
            INSERT INTO transactions (
                transaction_kind,
                transaction_status,
                from_user_id,
                to_user_id,
                amount_paise,
                currency,
                idempotency_key,
                description
            )
            VALUES (
                'debit',
                'pending',
                $1,
                $2,
                $3,
                'INR',
                $4,
                'User to user wallet transfer'
            )
            RETURNING transaction_id
            `,
            [from_user_id, to_user_id, amount_paise, idempotency_key]
        );

        const transaction_id = transactionResult.rows[0].transaction_id;

        /* --------------------------------------------------
           5. Ledger entries (double entry)
        -------------------------------------------------- */

        // Debit sender
        await client.query(
            `
            INSERT INTO ledger_entries (
                transaction_id,
                entry_type,
                account_type,
                account_id,
                amount_paise
            )
            VALUES ($1, 'debit', 'wallet', $2, $3)
            `,
            [transaction_id, senderWallet.wallet_account_id, amount_paise]
        );

        // Credit receiver
        await client.query(
            `
            INSERT INTO ledger_entries (
                transaction_id,
                entry_type,
                account_type,
                account_id,
                amount_paise
            )
            VALUES ($1, 'credit', 'wallet', $2, $3)
            `,
            [transaction_id, receiverWallet.wallet_account_id, amount_paise]
        );

        /* --------------------------------------------------
           6. Update wallet balances
        -------------------------------------------------- */
        const senderBalanceResult = await client.query(
            `
            UPDATE wallet_accounts
            SET balance_cached = balance_cached - $1
            WHERE wallet_account_id = $2
            RETURNING balance_cached
            `,
            [amount_paise, senderWallet.wallet_account_id]
        );

        const updatedSenderBalance = senderBalanceResult.rows[0].balance_cached;

        await client.query(
            `
            UPDATE wallet_accounts
            SET balance_cached = balance_cached + $1
            WHERE wallet_account_id = $2
            `,
            [amount_paise, receiverWallet.wallet_account_id]
        );

        /* --------------------------------------------------
           7. Mark transaction completed
        -------------------------------------------------- */
        await client.query(
            `
            UPDATE transactions
            SET transaction_status = 'completed'
            WHERE transaction_id = $1
            `,
            [transaction_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Payment successful",
            transaction_id,
            wallet_balance_paise: Number(updatedSenderBalance),
        });
    } catch (err) {
        await client.query("ROLLBACK");

        // Handle idempotency replay
        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Duplicate transaction (idempotency key reused)",
            });
        }

        console.error("Error processing user to user payment:", err);

        return res.status(500).json({
            success: false,
            message: "Error processing user to user payment",
            error: err.message,
        });
    } finally {
        client.release();
    }
};
