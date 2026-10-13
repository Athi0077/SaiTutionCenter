const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    calculatorAmounts: {
      student: {
        type: Number,
        default: 0,
        min: 0
      },
      teacher: {
        type: Number,
        default: 0,
        min: 0
      },
      principal: {
        type: Number,
        default: 0,
        min: 0
      },
      parent: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    schoolName: {
      type: String,
      default: "StudyMate School",
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
