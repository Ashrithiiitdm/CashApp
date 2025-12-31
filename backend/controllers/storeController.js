import pool from "../db";

export const addStore = async (req, res) => {
    try {
        const { name, location } = req.body;

        const vendor_id = req.user_id;

        await pool.query(
            `
                INSERT INTO Stores (vendor_id, display_name, status, location_text)
                VALUES ($1, $2, 'active', $3)
            `,
            [vendor_id, name, location]
        );

        return res.status(201).json({
            success: true,
            message: "Store added successfully",
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
        // Get name, location, status
        const result = await pool.query(
            `
                SELECT display_name, location_text, status
                FROM Stores
            `
        );

        return res.status(200).json({
            success: true,
            stores: result.rowCount > 0 ? result.rows : [],
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

export const addItems = async (req, res) => {
    const client = await pool.connect();

    try {
        const user_id = req.user_id;
        const { items, store_id } = req.body;

        // Validation for items array
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items must be a non-empty array",
            });
        }

        for (const item of items) {
            const { name, price, unit, categories } = item;

            if (!name || !price || !Array.isArray(categories) || !unit) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Each item must have a name, price, unit, and categories",
                });
            }
        }

        await client.query("BEGIN");

        //Check store ownership
        const storeResult = await client.query(
            `
                SELECT vendor_id
                FROM Stores
                WHERE store_id = $1
            `,
            [store_id]
        );

        if (storeResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        if (storeResult.rows[0].vendor_id !== user_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to add items to this store",
            });
        }

        // Bulk insert sql
        const insertValues = [];
        const valuePlaceholders = [];

        items.forEach((item, index) => {
            const baseIndex = index * 7;
            insertValues.push(
                store_id,
                item.name,
                item.description || null,
                item.quantity || null,
                item.unit,
                item.price,
                item.categories
            );
            valuePlaceholders.push(
                `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
            );
        });

        const insertQuery = `
            INSERT INTO Items (store_id, item_name, description, quantity, unit, price_per_unit_paise, categories)
            VALUES ${valuePlaceholders.join(", ")}
        `;

        await client.query(insertQuery, insertValues);

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Items added successfully",
        });
    } catch (err) {
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
