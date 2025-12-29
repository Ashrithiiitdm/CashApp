import jwt from "jsonwebtoken";

// Middleware to verify JWT tokens (used for protected routes)
export const jwtAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access - No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const jwtSecret = process.env.JWT_SECRET;

        // Verify JWT token
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user info to request
        // req.user = decoded;
        req.user_id = decoded.user_id;

        next();
    } catch (err) {
        console.error("JWT Auth Middleware Error:", err);
        return res.status(401).json({
            success: false,
            message: "Unauthorized access - Invalid token",
        });
    }
};
