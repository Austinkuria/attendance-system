const multer = require("multer");
const path = require("path");

// Set up file storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Store uploaded files in the "uploads" folder
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
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    // Handle CSV file processing here
    res.status(200).json({ message: "File uploaded successfully", file: req.file });
};

module.exports = { upload, handleFileUpload };
