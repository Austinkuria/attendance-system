const express = require('express');
const quizController = require('../controllers/quizController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

// Route to add a new quiz
router.post('/', authenticate, quizController.addQuiz);

// Route to retrieve all quizzes
router.get('/', authenticate, quizController.getPastQuizzes);
router.delete('/:id', authenticate, quizController.deleteQuiz); // Route to delete a quiz
module.exports = router;
