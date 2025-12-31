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
