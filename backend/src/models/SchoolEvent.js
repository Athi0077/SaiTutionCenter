const mongoose = require("mongoose");

const schoolEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Sports", "Arts", "Literary", "Science & Technology", "Cultural", "Other"],
      required: true,
    },
    topic: { type: String, required: true },
    subtopic: { type: String, default: "" },
    description: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    eventDate: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    venue: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    eligibleClasses: [{ type: String }], // e.g. ["10 - A", "10 - B", "9 - A"]
    participantLimit: { type: Number, default: 0 }, // 0 = unlimited
    status: {
      type: String,
      enum: ["draft", "published", "completed", "cancelled"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

schoolEventSchema.index({ status: 1, eventDate: -1 });
schoolEventSchema.index({ category: 1 });
schoolEventSchema.index({ registrationDeadline: 1 });

const SchoolEvent = mongoose.model("SchoolEvent", schoolEventSchema);

module.exports = SchoolEvent;
