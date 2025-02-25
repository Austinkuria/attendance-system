const Feedback = require('../models/Feedback');
const Session = require('../models/Session');

exports.submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, feedbackText, pace, interactivity, clarity, resources } = req.body;
    const studentId = req.user.userId; // From JWT middleware

    if (!sessionId || !rating) {
      return res.status(400).json({ message: 'Session ID and rating are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session || !session.ended) {
      return res.status(400).json({ message: 'Feedback can only be submitted for ended sessions' });
    }

    const existingFeedback = await Feedback.findOne({ sessionId, studentId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this session' });
    }

    const feedback = new Feedback({
      sessionId,
      studentId,
      rating,
      feedbackText,
      pace,
      interactivity,
      clarity,
      resources
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
};

exports.getFeedbackForLecturer = async (req, res) => {
  try {
    const lecturerId = req.user.userId;
    const sessions = await Session.find({ lecturer: lecturerId, ended: true }).select('_id');
    const sessionIds = sessions.map(s => s._id);

    const feedback = await Feedback.find({ sessionId: { $in: sessionIds } })
      .populate('studentId', 'name')
      .populate('sessionId', 'unit');

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('studentId', 'name')
      .populate('sessionId', 'unit lecturer');
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.getFeedbackSummary = async (req, res) => {
  try {
    const summary = await Feedback.aggregate([
      {
        $group: {
          _id: '$sessionId',
          averageRating: { $avg: '$rating' },
          averagePace: { $avg: '$pace' },
          averageInteractivity: { $avg: '$interactivity' },
          clarityYes: { $sum: { $cond: ['$clarity', 1, 0] } },
          totalFeedback: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $unwind: '$session' },
      {
        $project: {
          sessionId: '$_id',
          unit: '$session.unit',
          averageRating: 1,
          averagePace: 1,
          averageInteractivity: 1,
          clarityYes: 1,
          totalFeedback: 1
        }
      }
    ]);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};