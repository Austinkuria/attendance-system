const Attendance = require("../models/Attendance");
const Unit = require("../models/Unit");
const QRCode = require('qrcode');

// Get attendance records for a unit
const getUnitAttendance = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Verify lecturer access
    const lecturer = await User.findById(req.user.id);
    if (!lecturer.assignedUnits.includes(unit._id)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const attendance = await Attendance.find({ unit: req.params.unitId })
      .populate('student', 'firstName lastName regNo')
      .sort({ createdAt: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance records",
      error: error.message
    });
  }
};

// Generate QR Code for attendance session
const generateQRCode = async (req, res) => {
  try {
    const { unitId } = req.body;
    const qrData = JSON.stringify({
      unitId,
      timestamp: new Date().toISOString(),
      lecturerId: req.user.id
    });

    const qrCode = await QRCode.toDataURL(qrData);
    
    res.status(200).json({ qrCode });
  } catch (error) {
    res.status(500).json({
      message: "Error generating QR code",
      error: error.message
    });
  }
};

// Update attendance status
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('student', 'firstName lastName regNo');

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Error updating attendance",
      error: error.message
    });
  }
};

module.exports = { getUnitAttendance, generateQRCode, updateAttendance };