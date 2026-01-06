import multer from "multer";

// Use memory storage for Vercel serverless compatibility
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit for Vercel compute constraints
    },
});

export default upload;
