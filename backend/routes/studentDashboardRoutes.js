const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  getStudentToday,
  getStudentTrends,
  exportStudentTrends,
  submitLectureFeedback,
  getStudentSettings,
  updateStudentSettings
} = require("../controllers/studentDashboardController");

router.get("/today", authenticate, getStudentToday);
router.get("/trends", authenticate, getStudentTrends);
router.get("/trends/export", authenticate, exportStudentTrends);
router.post("/feedback", authenticate, submitLectureFeedback);
router.get("/settings", authenticate, getStudentSettings);
router.patch("/settings", authenticate, updateStudentSettings);
router.put("/settings", authenticate, updateStudentSettings);

module.exports = router;
