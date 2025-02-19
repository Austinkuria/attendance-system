const router = require('express').Router();
const { marktAttendance,handleSessionEnd,markAttendance } = require('../controllers/attendance.controller');

const authenticate = require('../middleware/authMiddleware');


router.post('/mark', authenticate, markAttendance);
router.post("/mark-absent",handleSessionEnd);


module.exports = router;
