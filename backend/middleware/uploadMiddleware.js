const multer = require("multer");

// Set up storage options for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // Create a unique file name
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only CSV files
    if (file.mimetype === "text/csv") {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only CSV files are allowed."), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
