const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolEvent", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate registrations
eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1 });
eventRegistrationSchema.index({ studentId: 1 });

const EventRegistration = mongoose.model("EventRegistration", eventRegistrationSchema);

module.exports = EventRegistration;
