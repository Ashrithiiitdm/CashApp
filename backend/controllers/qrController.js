import pool from "../db.js";
import { hashToken, generateRawToken } from "../services/utils.js";
import crypto from "crypto";

export const resolveStaticQr = async (req, res) => {
    try {
        const { user_id, store_id } = req.body;

        if (user_id) {
            const { rows } = await pool.query(
                `
                    SELECT user_id, full_name FROM Users WHERE user_id = $1
                
                `,
                [user_id]
            );

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "User not found or inactive",
                });
            }

            return res.status(200).json({
                qrType: "static",
                receiverType: "user",
                success: true,
                message: "Redirecting to user profile",
                receiverId: rows[0].user_id,
                receiverName: rows[0].full_name,
            });
        }

        if (store_id) {
            const { rows } = await pool.query(
                `
                    SELECT store_id, display_name FROM Stores WHERE store_id = $1 AND isActive = $2
                
                `,
                [store_id, true]
            );

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "Store not found or inactive",
                });
            }

            return res.status(200).json({
                qrType: "static",
                success: true,
                receiverType: "store",
                message: "Redirecting to store profile",
                receiverId: rows[0].store_id,
                receiverName: rows[0].display_name,
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid QR",
        });
    } catch (err) {
        console.error("Error resolving static QR:", err);
        return res.status(500).json({
            success: false,
            message: "Error scanning QR code",
            error: err.message,
        });
    }
};

export const createDynamicQr = async (req, res) => {
    try {
        const {
            store_id,
            user_id,
            amount_paise,
            expiresInMinutes = 10,
            metadata = {},
        } = req.body;

        if (!store_id || !user_id || !amount_paise) {
            return res.status(400).json({
                success: false,
                message:
                    "store_id, user_id and amount_paise are required to create dynamic QR",
            });
        }

        const rawToken = generateRawToken();

        const tokenHash = hashToken(rawToken);
        const nonce = crypto.randomUUID();

        await pool.query(
            `
                INSERT INTO Qr_payment_tokens
                (token_hash, store_id, user_id, amount_paise, nonce, expires_at, metadata)
                VALUES ($1, $2, $3, $4, $5, NOW() + ($6 * INTERVAL '1 minute'), $7)
            `,
            [
                tokenHash,
                store_id ?? null,
                user_id ?? null,
                amount_paise,
                nonce,
                expiresInMinutes,
                metadata,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Dynamic QR code created successfully",
            qrType: "dynamic",
            token: rawToken,
            expiresInMinutes,
        });
    } catch (err) {
        console.error("Error creating dynamic QR:", err);
        return res.status(500).json({
            success: false,
            message: "Error creating dynamic QR code",
            error: err.message,
        });
    }
};

export const resolveDynamicQr = async (req, res) => {
    try {
        const { qrToken } = req.params;

        const tokenHash = hashToken(qrToken);

        const { rows } = await pool.query(
            `
                SELECT qr_id, store_id, user_id, amount_paise, currency
                FROM Qr_payment_tokens
                WHERE token_hash = $1 AND status = 'issued' AND expires_at > NOW()
            
            `,
            [tokenHash]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired dynamic QR token",
            });
        }

        const qr = rows[0];

        return res.status(200).json({
            success: true,
            qrType: "dynamic",
            message: "Dynamic QR token resolved successfully",
            receiverType: qr.store_id ? "store" : "user",
            receiverId: qr.store_id ?? qr.user_id,
            amount_paise: qr.amount_paise,
            currency: qr.currency,
        });
    } catch (err) {
        console.error("Error resolving dynamic QR:", err);
        return res.status(500).json({
            success: false,
            message: "Error resolving dynamic QR code",
            error: err.message,
        });
    }
};
