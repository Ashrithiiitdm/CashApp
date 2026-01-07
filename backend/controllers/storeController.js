import pool from "../db.js";
import { extractItemsFromFile } from "../services/itemExtractor.js";

export const getStoreRecentTransactions = async (req, res) => {
    try {
        const { store_id } = req.params;
        const search = req.query.search?.trim();

        if (!store_id) {
            return res.status(400).json({
                success: false,
                message: "store_id is required",
            });
        }

        let baseQuery = `
            SELECT
                T.transaction_id,

                CASE
                    WHEN T.transaction_kind = 'debit' THEN 'credit'
                    WHEN T.transaction_kind = 'credit' THEN 'debit'
                END AS transaction_kind,

                T.transaction_status,
                T.amount_paise,
                T.currency,
                T.created_at,
                T.metadata,

                U.user_id,
                U.full_name,
                U.cashapp_id

            FROM transactions T
            JOIN users U
                ON U.user_id = T.from_user_id
            WHERE T.store_id = $1
              AND T.transaction_status = 'completed'
        `;

        const params = [store_id];

        if (search) {
            baseQuery += `
                AND (
                    U.full_name ILIKE $2
                 OR U.cashapp_id ILIKE $2
                )
            `;
            params.push(`%${search}%`);
        }

        const finalQuery = `
            ${baseQuery}
            ORDER BY T.created_at DESC
            LIMIT 20
        `;

        const { rows } = await pool.query(finalQuery, params);

        return res.json({
            success: true,
            recent_transactions: rows,
        });
    } catch (err) {
        console.error("Error fetching store recent transactions:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching store recent transactions",
        });
    }
};

export const addStore = async (req, res) => {
    try {
        const { name, location, store_logo } = req.body;

        const owner_user_id = req.user_id;

        const vendorResult = await pool.query(
            `
                SELECT vendor_id
                FROM Vendors
                WHERE owner_user_id = $1 
            `,
            [owner_user_id]
        );

        if (vendorResult.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not registered as a vendor",
            });
        }

        const vendor_id = vendorResult.rows[0].vendor_id;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Store name is required",
            });
        }


        const storeResponse = await pool.query(
            `
                INSERT INTO Stores (vendor_id, display_name, status, location_text, store_logo)
                VALUES ($1, $2, 'active', $3, $4) RETURNING store_id
            `,
            [vendor_id, name, location, store_logo]
        );

        const store_id = storeResponse.rows[0].store_id;

        return res.status(201).json({
            success: true,
            message: "Store added successfully",
            store_id: store_id,
        });
    } catch (err) {
        console.error("Error adding store:", err);

        return res.status(500).json({
            success: false,
            message: "Error adding store",
            error: err.message,
        });
    }
};

export const getStores = async (req, res) => {
    try {
        const owner_user_id = req.user_id;

        // Get vendor_id for this user
        const vendorResult = await pool.query(
            `
                SELECT vendor_id
                FROM Vendors
                WHERE owner_user_id = $1 
            `,
            [owner_user_id]
        );

        if (vendorResult.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not registered as a vendor",
            });
        }

        const vendor_id = vendorResult.rows[0].vendor_id;

        // Get stores owned by this vendor
        const result = await pool.query(
            `
                SELECT store_id, display_name, location_text, status, description, store_logo, created_at
                FROM Stores
                WHERE vendor_id = $1
                ORDER BY created_at DESC
            `,
            [vendor_id]
        );

        // Map database columns to frontend-expected property names
        const stores = result.rows.map((store) => ({
            id: store.store_id,
            name: store.display_name,
            address: store.location_text,
            icon_id: store.store_logo,
            status: store.status,
            description: store.description,
            created_at: store.created_at,
        }));

        return res.status(200).json({
            success: true,
            stores: stores.length > 0 ? stores : [],
        });
    } catch (err) {
        console.error("Error fetching stores:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching stores",
            error: err.message,
        });
    }
};

export const searchStores = async (req, res) => {
    try {
        const { query } = req.query;

        let sqlQuery = `
            SELECT store_id, display_name, location_text, status, description
            FROM Stores
            WHERE status = 'active'
        `;
        const params = [];

        if (query) {
            sqlQuery += ` AND (display_name ILIKE $1 OR location_text ILIKE $1)`;
            params.push(`%${query}%`);
        }

        sqlQuery += ` ORDER BY display_name ASC`;

        const result = await pool.query(sqlQuery, params);

        return res.status(200).json({
            success: true,
            stores: result.rowCount > 0 ? result.rows : [],
        });
    } catch (err) {
        console.error("Error searching stores:", err);
        return res.status(500).json({
            success: false,
            message: "Error searching stores",
            error: err.message,
        });
    }
};

export const getStoreDetails = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Get store details
        const storeResult = await pool.query(
            `
                SELECT store_id, display_name, location_text, status, description, created_at
                FROM Stores
                WHERE store_id = $1
            `,
            [storeId]
        );

        if (storeResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        // Get items for this store
        const itemsResult = await pool.query(
            `
                SELECT item_id, item_name, description, quantity, 
                       price_per_unit_paise, categories, created_at
                FROM Items
                WHERE store_id = $1
                ORDER BY item_name ASC
            `,
            [storeId]
        );

        const store = storeResult.rows[0];
        store.items = itemsResult.rows;

        return res.status(200).json({
            success: true,
            store: storeResult.rowCount > 0 ? store : [],
        });
    } catch (err) {
        console.error("Error fetching store details:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching store details",
            error: err.message,
        });
    }
};

export const updateStore = async (req, res) => {
    const client = await pool.connect();
    try {
        const { store_id, name, location } = req.body;
        const owner_user_id = req.user_id; // From auth middleware

        // 1. Verify Ownership
        const checkOwner = await client.query(
            `SELECT s.store_id 
             FROM Stores s
             JOIN Vendors v ON s.vendor_id = v.vendor_id
             WHERE s.store_id = $1 AND v.owner_user_id = $2`,
            [store_id, owner_user_id]
        );

        if (checkOwner.rowCount === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or Store not found" });
        }

        // 2. Update Store
        await client.query(
            `UPDATE Stores SET display_name = $1, location_text = $2 WHERE store_id = $3`,
            [name, location, store_id]
        );

        res.json({ success: true, message: "Store updated successfully" });

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        client.release();
    }
};

export const addItems = async (req, res) => {
    const client = await pool.connect();

    try {
        const owner_user_id = req.user_id;
        const { items, store_id } = req.body;

        // 1. Basic Validation
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items must be a non-empty array",
            });
        }

        // 2. Get Vendor ID
        const userResponse = await pool.query(
            `SELECT vendor_id FROM Vendors WHERE owner_user_id = $1`,
            [owner_user_id]
        );
        const user_id = userResponse.rows[0]?.vendor_id;

        // 3. Start Transaction
        await client.query("BEGIN");

        // 4. Verify Store Ownership
        const storeResult = await client.query(
            `SELECT vendor_id FROM Stores WHERE store_id = $1`,
            [store_id]
        );

        if (storeResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        if (storeResult.rows[0].vendor_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        // 5. Deduplicate Input Array (Client side duplicates)
        // We use a Map to ensure we only try to insert unique names from the request itself
        const uniqueInputItems = new Map();
        
        for (const item of items) {
            if (!item.name || !item.price) continue; // Skip invalid items silently
            
            const normalizedName = item.name.trim().toLowerCase();
            
            // Only add if we haven't seen this name in this request yet
            if (!uniqueInputItems.has(normalizedName)) {
                uniqueInputItems.set(normalizedName, item);
            }
        }

        const namesToCheck = Array.from(uniqueInputItems.keys());

        if (namesToCheck.length === 0) {
            await client.query("ROLLBACK");
            return res.status(200).json({ success: true, message: "No valid items to add." });
        }

        // 6. Check Database for Existing Items
        const existingRes = await client.query(
            `SELECT item_name FROM Items WHERE store_id = $1 AND lower(item_name) = ANY($2)`,
            [store_id, namesToCheck]
        );

        // Create a Set of names that already exist in DB
        const existingNamesSet = new Set(existingRes.rows.map((r) => r.item_name.toLowerCase()));

        // 7. Filter: Create Final Insert List (Input - ExistingDB)
        const itemsToInsert = [];
        
        uniqueInputItems.forEach((item, normalizedName) => {
            // Only add if NOT in database
            if (!existingNamesSet.has(normalizedName)) {
                itemsToInsert.push(item);
            }
        });

        // 8. Bulk Insert (Only if there are items left)
        if (itemsToInsert.length > 0) {
            const insertValues = [];
            const valuePlaceholders = [];

            itemsToInsert.forEach((item, index) => {
                const baseIndex = index * 6;
                insertValues.push(
                    store_id,
                    item.name.trim(), // Ensure we save the trimmed name
                    item.description || null,
                    item.quantity || null,
                    item.price,
                    item.categories || [] // Default to empty array if missing
                );
                valuePlaceholders.push(
                    `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
                );
            });

            const insertQuery = `
                INSERT INTO Items (store_id, item_name, description, quantity, price_per_unit_paise, categories)
                VALUES ${valuePlaceholders.join(", ")}
            `;

            await client.query(insertQuery, insertValues);
        }

        await client.query("COMMIT");

        console.log(`Request items: ${items.length}, Unique Input: ${uniqueInputItems.size}, Actually Inserted: ${itemsToInsert.length}`);

        return res.status(201).json({
            success: true,
            message: "Items processed successfully",
            addedCount: itemsToInsert.length,
            skippedCount: uniqueInputItems.size - itemsToInsert.length
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error adding items:", err);
        return res.status(500).json({
            success: false,
            message: "Error adding items",
            error: err.message,
        });
    } finally {
        client.release();
    }
};

export const extractItems = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const filename = req.file.originalname;
        const fileSizeInMB = req.file.size / (1024 * 1024);

        console.log("📁 Received file:", filename);
        console.log("   Size:", (req.file.size / 1024).toFixed(2), "KB");
        console.log("   Type:", mimeType);

        // Reject files larger than 1 MB due to Vercel compute limitations
        if (fileSizeInMB > 1) {
            return res.status(400).json({
                success: false,
                message: `File size (${fileSizeInMB.toFixed(2)} MB) exceeds the 1 MB limit. Please upload a smaller file.`,
            });
        }

        // Extract items from the file buffer
        const result = await extractItemsFromFile(fileBuffer, mimeType, filename);

        if (result.success) {
            return res.json({
                success: true,
                items: result.items,
                message: `Successfully extracted ${result.items.length} items`,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: result.error || "Failed to extract items",
            });
        }
    } catch (error) {
        console.error("❌ Error in extractItems controller:", error);

        return res.status(500).json({
            success: false,
            message: "Error extracting items from file",
            error: error.message,
        });
    }
};

