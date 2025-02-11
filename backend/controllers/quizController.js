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
  

// Retrieve all quizzes (with optional filtering)
exports.getPastQuizzes = async (req, res) => {
  try {
      const { lecturerId, date } = req.query;

      // Build the query object
      const query = {};

      // Filter by lecturerId (assuming lecturerId is associated with the unit)
      if (lecturerId) {
          query.unit = lecturerId; // Assuming lecturerId is the same as unit ID
      }

      // Filter by date
      if (date) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0); // Start of the day
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999); // End of the day

          query.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }

      // Fetch quizzes with optional unit population
      const quizzes = await Quiz.find(query).populate('unit', 'name code'); // Populate unit details
      res.status(200).json(quizzes);
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving quizzes', error: error.message });
  }
};
