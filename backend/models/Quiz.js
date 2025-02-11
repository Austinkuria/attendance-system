const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String, // Optional field
    method: String, // Optional field
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
    createdAt: { type: Date, default: Date.now }, // Automatically add creation date
});

module.exports = mongoose.model("Quiz", quizSchema);