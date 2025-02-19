const router = require('express').Router();
const { detectCurrentSession, createSession, endSession } = require('../controllers/session.controller');

const authenticate = require('../middleware/authMiddleware');

router.get('/current', authenticate, detectCurrentSession);
router.post('/create', authenticate, createSession);
router.delete('/end', authenticate, endSession);

router.get('/sessions/current/:selectedUnit',authenticate, async (req, res) => {
    try {
      const { unitId } = req.params;
      const session = await Session.findOne({ unitId, isActive: true });
  
      if (!session) return res.status(404).json({ message: "No active session found" });
  
      res.json(session);
    } catch (err) {
      console.error("Error fetching session:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  

module.exports = router;
