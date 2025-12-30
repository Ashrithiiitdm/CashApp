import pool from "../db";

export const createVendor = async (req, res) => {
    try {
        const user_id = req.user_id;

        const { vendor_name, account_id } = req.body;
        
        if (!vendor_name || !account_id) {
            return res.status(400).json({
                success: false,
                message: "vendor_name and account_id are required",
            });
        }

        // Check if user is already a vendor
        const existingVendor = await pool.query(
            "SELECT * FROM vendors WHERE owner_user_id = $1",
            [user_id]
        );

        if (existingVendor.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User is already a vendor",
            });
        }

        await pool.query(
            "INSERT INTO Vendors (vendor_name, owner_user_id, account_id) VALUES ($1, $2, $3)",
            [vendor_name, user_id, account_id]
        );

        return res.status(201).json({
            success: true,
            message: "Vendor created successfully",
        });
    } catch (err) {
        console.error("Error creating vendor:", err);
        return res.status(500).json({
            success: false,
            message: "Error creating vendor",
            error: err.message,
        });
    }
};

export const getVendors = async (req, res) => {
    try {
        const vendorsResult = await pool.query("SELECT * FROM Vendors");
        const vendors = vendorsResult.rows;

        return res.status(200).json({
            success: true,
            vendors: vendors,
        });
    } catch (err) {
        console.error("Error fetching vendors:", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching vendors",
            error: err.message,
        });
    }
};
