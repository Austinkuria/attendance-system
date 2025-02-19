const router = require('express').Router();
const { marktAttendance,handleSessionEnd,markAttendance } = require('../controllers/attendance.controller');

const authenticate = require('../middleware/authMiddleware');


router.post("/mark", authenticate, markAttendance, (req, res) => {
    console.log("Incoming Authorization Header:", req.headers.authorization);
    console.log("Request Body:", req.body);
    
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Authorization header missing" });
    }
});

router.post("/mark-absent",handleSessionEnd);


module.exports = router;
