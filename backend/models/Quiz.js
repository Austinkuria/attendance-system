const mongoose = require("mongoose")
const quizSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            optionText: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
        answer: {
          type: String,
          required: true,
        },
      },
    ],
  });
  
  module.exports = mongoose.model('Quiz', quizSchema);