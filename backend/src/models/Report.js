const mongoose = require("mongoose");

const reportHistorySchema = new mongoose.Schema({
  oldStatus: String,
  newStatus: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['Normal', 'High', 'Urgent'], 
      default: 'Normal' 
    },
    status: { 
      type: String, 
      enum: ['SUBMITTED', 'IN_PROGRESS', 'WAITING_FOR_INFORMATION', 'ESCALATED', 'RESOLVED', 'CLOSED'], 
      default: 'SUBMITTED' 
    },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reporterRole: { type: String, required: true },
    relatedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedRole: { type: String }, // 'teacher' or 'principal'
    history: [reportHistorySchema],
    schoolId: { type: String }
  },
  { timestamps: true }
);

// Auto-generate report ID
reportSchema.pre('save', async function() {
  if (this.isNew && !this.reportId) {
    const date = new Date();
    const prefix = `REP${date.getFullYear().toString().substr(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
    try {
      const Counter = mongoose.model('Counter');
      const counter = await Counter.findOneAndUpdate(
        { _id: `report_${prefix}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.reportId = `${prefix}${String(counter.seq).padStart(4, '0')}`;
    } catch (error) {
      // If Counter model doesn't exist or fails, fallback to random
      this.reportId = `${prefix}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
  }
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
