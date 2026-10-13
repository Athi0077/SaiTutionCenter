const mongoose = require("mongoose");

const eventResultSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolEvent", required: true, unique: true },
    firstPlace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    secondPlace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    thirdPlace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resultStatus: {
      type: String,
      enum: ["draft", "submitted", "returned", "approved", "published"],
      default: "draft",
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    publishedAt: { type: Date },
    returnNote: { type: String, default: "" },
  },
  { timestamps: true }
);

eventResultSchema.index({ eventId: 1 });
eventResultSchema.index({ resultStatus: 1 });

const EventResult = mongoose.model("EventResult", eventResultSchema);

module.exports = EventResult;
