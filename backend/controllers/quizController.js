const Quiz = require('../models/Quiz');

// Add a new quiz
exports.addQuiz = async (req, res) => {
    try {
        const quizData = {
            ...req.body,
            createdAt: new Date(), // Explicitly set creation date (optional)
        };
        const quiz = new Quiz(quizData);
        await quiz.save();
        res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error creating quiz', error: error.message });
    }
};
  
// Retrieve all quizzes
exports.getPastQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving quizzes', error });
    }
};
