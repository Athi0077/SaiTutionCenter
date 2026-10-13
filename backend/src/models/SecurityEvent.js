const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        "login_success",
        "login_failed",
        "password_reset",
        "password_change",
        "suspicious_login",
        "account_locked",
      ],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying by target account and time
securityEventSchema.index({ targetId: 1, createdAt: -1 });

const SecurityEvent = mongoose.model("SecurityEvent", securityEventSchema);

module.exports = SecurityEvent;
