const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String, // Add description if needed
    method: String, // Add method if needed
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    questions: [
        {
            question: { type: String, required: true },
            options: [
                {
                    optionText: { type: String, required: true },
                    isCorrect: { type: Boolean, required: true },
                },
            ],
            answer: { type: String, required: true, default: "Not provided" }, // Ensure default
        },
    ],
});

module.exports = mongoose.model("Quiz", quizSchema);