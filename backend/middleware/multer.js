import multer from "multer";

// Use memory storage for Vercel serverless compatibility
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit for Vercel compute constraints
    },
    fileFilter: (req, file, cb) => {
        // Only accept image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

export default upload;
