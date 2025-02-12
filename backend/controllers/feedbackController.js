const Feedback = require('../models/Feedback');
const AttendanceSession = require('../models/AttendanceSession');
const Session = require('../models/Session');

exports.submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, feedbackText } = req.body;
    const studentId = req.user.id;

    // Check if the student attended the session
    const attendance = await AttendanceSession.findOne({
      _id: sessionId,
      "attendance.student": studentId,
    });

    if (!attendance) {
      return res.status(403).json({ message: "You can only submit feedback if you attended the session." });
    }

    // Create and save feedback
    const feedback = new Feedback({
      session: sessionId,
      student: studentId,
      rating,
      feedbackText
    });

    await feedback.save();

    // Link feedback to the session
    await Session.findByIdAndUpdate(sessionId, { $push: { feedback: feedback._id } });

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    res.status(400).json({ message: "Error submitting feedback", error: error.message });
  }
};

// Fetch feedback for a session
exports.getSessionFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ session: req.params.sessionId })
      .populate('student', 'firstName lastName email')
      .lean();

    const averageRating = feedback.length > 0
      ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(2)
      : 0;

    res.json({
      averageRating,
      comments: feedback.map(f => ({
        feedbackText: f.feedbackText,
        studentName: `${f.student.firstName} ${f.student.lastName}`,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};
