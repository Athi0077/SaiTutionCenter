const mongoose = require("mongoose");

const reportMessageSchema = new mongoose.Schema(
  {
    reportId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Report", 
      required: true,
      index: true
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    senderRole: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    isInternalNote: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

const ReportMessage = mongoose.model("ReportMessage", reportMessageSchema);
module.exports = ReportMessage;
