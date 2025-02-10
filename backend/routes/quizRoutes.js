const express = require('express');
const quizController = require('../controllers/quizController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

// Route to add a new quiz
router.post('/quizzes', authenticate, quizController.addQuiz);

// Route to retrieve all quizzes
router.get('/quizzes', authenticate, quizController.getQuizzes);

module.exports = router;
