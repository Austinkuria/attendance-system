const Quiz = require('../models/Quiz');

// Create a new quiz
exports.addQuiz = async (req, res) => {
    try {
        const quizData = { ...req.body, createdAt: new Date() };
        const quiz = new Quiz(quizData);
        await quiz.save();
        res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error creating quiz', error: error.message });
    }
};

// Retrieve all quizzes
exports.getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving quizzes', error: error.message });
    }
};

// Retrieve past quizzes
exports.getPastQuizzes = async (req, res) => {
    try {
        const { lecturerId } = req.query;
        const filters = lecturerId ? { lecturerId } : {};
        const quizzes = await Quiz.find(filters);
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving past quizzes', error: error.message });
    }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuiz = await Quiz.findByIdAndDelete(id);
        if (!deletedQuiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};
