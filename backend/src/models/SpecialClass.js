const mongoose = require("mongoose");

const specialClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    imageUrl: {
      type: String
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eligibleStandards: [{
      type: String
    }],
    eligibleSections: [{
      type: String
    }],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    daysOfWeek: [{
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    }],
    startTime: {
      type: String
    },
    endTime: {
      type: String
    },
    venue: {
      type: String
    },
    maxStudents: {
      type: Number,
      default: null
    },
    registrationDeadline: {
      type: Date
    },
    enrollmentMode: {
      type: String,
      enum: ["Direct", "Approval"],
      default: "Approval"
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Registration Open", "Registration Closed", "Active", "Completed", "Archived"],
      default: "Draft"
    },
    skills: [{
      type: String
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    publishedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
specialClassSchema.index({ status: 1 });
specialClassSchema.index({ category: 1 });
specialClassSchema.index({ instructorId: 1 });

const SpecialClass = mongoose.model("SpecialClass", specialClassSchema);

module.exports = SpecialClass;
