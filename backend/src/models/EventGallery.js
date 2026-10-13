const mongoose = require("mongoose");

const eventGallerySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventGallery", eventGallerySchema);
