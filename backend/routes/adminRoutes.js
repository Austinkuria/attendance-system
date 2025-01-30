const express = require("express");
const { createAdmin, getAdmins } = require("../controllers/adminController");
const router = express.Router();

router.post("/create", createAdmin); // Create a new department admin
router.get("/list", getAdmins); // List all admins

module.exports = router;
