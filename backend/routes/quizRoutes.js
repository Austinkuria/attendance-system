const express = require('express');
const quizController = require('../controllers/quizController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticate, quizController.addQuiz);
// router.get('/:sessionId', authenticate, quizController.getQuizzesForSession);
router.post('/submit', authenticate, quizController.submitQuiz);

module.exports = router;
