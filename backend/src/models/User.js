const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "principal", "teacher", "student", "parent"],
      default: "student",
    },
    profilePic: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "pending", "blocked", "inactive"],
      default: "active",
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School', // Assuming there might be a school model, or just keeping the reference
      required: false,
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    grNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: {
      type: Date,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown / Not specified"],
      default: "Unknown / Not specified",
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    contactDetails: {
      parentName: String,
      parentPhone: String,
      address: String,
    },
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    employeeId: {
      type: String,
      sparse: true,
    },
    designation: {
      type: String,
    },
    joiningDate: {
      type: Date,
    },
    idCardStatus: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
    verificationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fcmTokens: [{
      type: String,
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByRole: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, status: 1 });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
