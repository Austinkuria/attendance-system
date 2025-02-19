const router = require('express').Router();
const { detectCurrentSession, createSession, endSession } = require('../controllers/session.controller');

const authenticate = require('../middleware/authMiddleware');

router.get('/current', authenticate, detectCurrentSession);
router.post('/create', authenticate, createSession);
router.delete('/end', authenticate, endSession);

router.get('/current/:selectedUnit',authenticate, detectCurrentSession);

module.exports = router;
