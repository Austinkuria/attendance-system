const router = require('express').Router();
const { detectCurrentSession, createAttendanceSession, endSession } = require('../controllers/session.controller');

const authenticate = require('../middleware/authMiddleware');

router.get('/current', authenticate, detectCurrentSession);
router.post('/create', authenticate, createAttendanceSession);
router.delete('/end', authenticate, endSession);


module.exports = router;
