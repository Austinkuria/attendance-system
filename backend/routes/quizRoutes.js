const express = require('express');
const quizController = require('../controllers/quizController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authenticate, quizController.addQuiz);
router.get('/', authenticate, quizController.getQuizzes); // Fetch all quizzes
router.get('/past', authenticate, quizController.getPastQuizzes); // Fetch past quizzes

module.exports = router;
