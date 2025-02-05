const { detectCurrentSession, createAttendanceSession } = require('../controllers/session.controller');
const authenticate = require('../middleware/authMiddleware');

router.get('/current', authenticate, detectCurrentSession);
router.post('/create', authenticate, createAttendanceSession);

module.exports = router;