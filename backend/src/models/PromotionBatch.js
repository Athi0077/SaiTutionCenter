const mongoose = require("mongoose");

const promotionBatchSchema = new mongoose.Schema({
  sourceAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  destinationAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ["preview", "processing", "completed", "failed"], default: "preview" },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  results: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ["promote", "graduate", "repeat", "transfer", "exclude"] },
    fromClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    toClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    status: { type: String, enum: ["pending", "success", "error"] },
    errorDetails: { type: String }
  }],
  summary: {
    totalProcessed: { type: Number, default: 0 },
    totalPromoted: { type: Number, default: 0 },
    totalGraduated: { type: Number, default: 0 },
    totalRepeating: { type: Number, default: 0 },
    totalTransferred: { type: Number, default: 0 },
    totalExcluded: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 }
  },
  completedAt: { type: Date }
}, { timestamps: true });

const PromotionBatch = mongoose.model("PromotionBatch", promotionBatchSchema);

module.exports = PromotionBatch;
