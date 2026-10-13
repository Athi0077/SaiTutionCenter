const mongoose = require("mongoose");

const temporaryPrincipalAccessSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  originalRole: {
    type: String,
    default: "teacher"
  },
  startAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["Scheduled", "Active", "Expired", "Revoked"],
    default: "Scheduled"
  },
  revokedAt: {
    type: Date
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

// Helper to determine real-time status based on time
temporaryPrincipalAccessSchema.methods.getCurrentStatus = function() {
  if (this.status === "Revoked") return "Revoked";
  if (this.status === "Expired") return "Expired";
  
  const now = new Date();
  if (now > this.expiresAt) return "Expired";
  if (now >= this.startAt && now <= this.expiresAt) return "Active";
  
  return "Scheduled";
};

const TemporaryPrincipalAccess = mongoose.model("TemporaryPrincipalAccess", temporaryPrincipalAccessSchema);

module.exports = TemporaryPrincipalAccess;
