const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  session: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Session", 
    required: true,
    index: true
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  status: { 
    type: String, 
    enum: ["Present", "Absent"], 
    default: "Present",
    required: true
  },
  markedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: false
  },
  updatedAt: { 
    type: Date, 
    default: null
  }
}, { timestamps: true });

AttendanceSchema.index({ session: 1, status: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);