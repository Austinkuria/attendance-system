const Feedback = require('../models/Feedback');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { sendNotification } = require('../controllers/session.controller');
const schedule = require('node-schedule');

exports.submitFeedback = async (req, res) => {
  try {
    const { sessionId, rating, feedbackText, pace, interactivity, clarity, resources, anonymous } = req.body;
    const studentId = req.user.userId;

    if (!sessionId || !rating) {
      return res.status(400).json({ message: 'Session ID and rating are required' });
    }

    const session = await Session.findById(sessionId).populate('unit');
    if (!session || !session.ended) {
      return res.status(400).json({ message: 'Feedback can only be submitted for ended sessions' });
    }

    const attendance = await Attendance.findOne({ session: sessionId, student: studentId, status: 'Present' });
    if (!attendance) {
      return res.status(403).json({ message: 'You must be present in this session to provide feedback' });
    }

    const latestSession = await Session.findOne({ unit: session.unit._id, ended: true }).sort({ endTime: -1 });
    if (latestSession._id.toString() !== sessionId) {
      return res.status(403).json({ message: 'Feedback can only be submitted for the latest session' });
    }

    const existingFeedback = await Feedback.findOne({ sessionId, studentId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this session' });
    }

    const feedback = new Feedback({
      sessionId,
      studentId,
      unit: session.unit._id,
      course: session.unit.course,
      rating,
      feedbackText,
      pace,
      interactivity,
      clarity,
      resources,
      anonymous
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
    const sessions = await Session.find({ lecturer: lecturerId, ended: true }).select('_id unit');
    const sessionIds = sessions.map(s => s._id);

    const feedback = await Feedback.find({ sessionId: { $in: sessionIds } })
      .populate('studentId', 'name')
      .populate('unit', 'name code')
      .populate('course', 'name');

    console.log('Fetched feedback:', feedback);

    const validFeedback = feedback.filter(item => {
      if (!item.unit || !item.unit.name) {
        console.warn('Feedback item missing unit data:', item);
        return false;
      }
      return true;
    });

    res.json(validFeedback.map(f => ({
      ...f.toObject(),
      studentId: f.anonymous ? { name: 'Anonymous' } : f.studentId
    })));
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('studentId', 'name')
      .populate('unit', 'name code')
      .populate('course', 'name')
      .populate('sessionId', 'unit lecturer');
    res.json(feedback.map(f => ({
      ...f.toObject(),
      studentId: f.anonymous ? { name: 'Anonymous' } : f.studentId
    })));
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
          _id: { sessionId: '$sessionId', unit: '$unit' },
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
          localField: '_id.sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $unwind: '$session' },
      {
        $lookup: {
          from: 'units',
          localField: '_id.unit',
          foreignField: '_id',
          as: 'unit'
        }
      },
      { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'unit.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sessionId: '$_id.sessionId',
          unit: '$unit.name',
          course: '$course.name',
          averageRating: 1,
          averagePace: 1,
          averageInteractivity: 1,
          clarityYes: 1,
          totalFeedback: 1
        }
      }
    ]);
    console.log('Aggregated summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
};

schedule.scheduleJob('0 8 * * *', async () => {
  try {
    const recentSessions = await Session.find({
      ended: true,
      endTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).populate('unit');

    for (const session of recentSessions) {
      const attendees = await Attendance.find({ session: session._id, status: 'Present' });
      for (const attendee of attendees) {
        const feedback = await Feedback.findOne({ sessionId: session._id, studentId: attendee.student });
        if (!feedback) {
          await sendNotification([attendee.student.toString()], {
            title: 'Feedback Reminder',
            message: `Please submit your feedback for the session on ${session.unit.name}.`,
            data: { sessionId: session._id.toString(), action: 'openFeedback' }
          });
          console.log(`Sent feedback reminder to student ${attendee.student} for session ${session._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending feedback reminders:', error);
  }
});