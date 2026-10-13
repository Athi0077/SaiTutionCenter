const mongoose = require("mongoose");

const motivationalQuoteSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    audience: {
      type: String,
      enum: ["students", "teachers", "both"],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to quickly find published quotes by audience
motivationalQuoteSchema.index({ status: 1, audience: 1 });

const MotivationalQuote = mongoose.model("MotivationalQuote", motivationalQuoteSchema);

module.exports = MotivationalQuote;
