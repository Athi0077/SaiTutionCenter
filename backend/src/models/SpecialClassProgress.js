const mongoose = require("mongoose");

const specialClassProgressSchema = new mongoose.Schema(
  {
    specialClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialClass",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Progress tracked dynamically by skill name defined in SpecialClass
    skillsProgress: [
      {
        skillName: { type: String, required: true },
        level: {
          type: String,
          enum: ["Not Started", "Beginner", "Developing", "Good", "Excellent"],
          default: "Not Started"
        }
      }
    ],
    feedback: {
      type: String
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

specialClassProgressSchema.index({ specialClassId: 1, studentId: 1 }, { unique: true });

const SpecialClassProgress = mongoose.model("SpecialClassProgress", specialClassProgressSchema);

module.exports = SpecialClassProgress;
