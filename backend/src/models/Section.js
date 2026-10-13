const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Standard",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a section name is unique within a specific standard
sectionSchema.index({ name: 1, standardId: 1 }, { unique: true });

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
