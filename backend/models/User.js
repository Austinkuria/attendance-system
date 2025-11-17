const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "lecturer", "department_admin", "super_admin"],
      required: true,
      index: true
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },

    // Student-specific
    regNo: {
      type: String,
      unique: true,
      sparse: true,
      required: function () { return this.role === "student"; }
    },
    year: {
      type: Number,
      min: 1,
      max: 6, // Support up to 6 years (e.g., medicine)
      required: function () { return this.role === "student"; }
    },
    semester: {
      type: Number,
      min: 1,
      max: 3,
      required: function () { return this.role === "student"; }
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function () { return this.role === "student"; }
    },
    enrolledUnits: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    }],

    // Common fields (for all except super_admin)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.role !== "super_admin";
      },
      index: true
    },

    // Lecturer-specific
    assignedUnits: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    }],

    // Department Admin specific
    managedDepartments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    }],

    // Super Admin flag
    isSuperAdmin: {
      type: Boolean,
      default: false
    },

    // Security fields
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    mustChangePassword: {
      type: Boolean,
      default: true
    },
    passwordChangedAt: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verificationToken: String,
    verificationTokenExpiry: Date,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    deviceId: { type: String }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ role: 1, course: 1, year: 1, semester: 1 });
// regNo index is already defined in schema with unique: true, sparse: true
userSchema.index({ managedDepartments: 1 }); // For department admin queries
userSchema.index({ isSuperAdmin: 1 }); // For super admin identification
userSchema.index({ createdBy: 1 }); // For audit trails

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for locked status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model("User", userSchema);
