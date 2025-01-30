const express = require("express");
const { upload, handleFileUpload } = require("../controllers/uploadController");

const router = express.Router();

// Route for uploading CSV files
router.post("/upload", upload.single("file"), handleFileUpload);

module.exports = router;
