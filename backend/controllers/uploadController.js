const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Ensure "uploads" directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up file storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to filename
    }
});

// File filter to accept only CSV files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "text/csv") {
        cb(null, true);
    } else {
        cb(new Error("Only CSV files are allowed"), false);
    }
};

// Create upload middleware
const upload = multer({ storage, fileFilter });

const handleFileUpload = (req, res) => {
    try {
        logger.info("Received file upload request");
        logger.debug("File details:", { filename: req.file?.originalname, size: req.file?.size });

        if (!req.file) {
            logger.warn("No file uploaded");
            return res.status(400).json({ message: "No file uploaded" });
        }

        res.status(200).json({ message: "File uploaded successfully", file: req.file });
    } catch (error) {
        logger.error("File upload error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { upload, handleFileUpload };
