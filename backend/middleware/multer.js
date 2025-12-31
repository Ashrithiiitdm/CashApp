import multer from "multer";

const Storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage: Storage,
});

export default upload;
