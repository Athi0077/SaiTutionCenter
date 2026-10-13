const mongoose = require("mongoose");

const tuitionFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
      default: null,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Standard",
      required: false,
      default: null,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
      default: null,
    },
    feePeriod: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    feeType: {
      type: String,
      required: false,
    },
    feeDetails: {
      type: String,
      required: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Partially Paid", "Paid", "Overdue", "PENDING", "COMPLETED"],
      default: "PENDING",
    },
    lastBilledMonth: {
      type: String, // e.g. "2026-10"
    },
    lastBilledYear: {
      type: Number, // e.g. 2026
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    billingPeriod: {
      type: String, // e.g. "October 2026", "Q3 2026", "Crash Course"
    },
    dueDate: {
      type: Date,
    },
    paymentHistory: [
      {
        amount: Number,
        date: { type: Date, default: Date.now },
        method: { type: String, enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other"] },
        remarks: String,
      }
    ],
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Dynamic pending amount calculation (virtual)
tuitionFeeSchema.virtual('pendingAmount').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Pre-save hook to update status automatically based on payments if old system is used
tuitionFeeSchema.pre('save', async function() {
  if (this.status === "PENDING" || this.status === "COMPLETED") {
    return;
  }
  if (this.paidAmount >= this.totalAmount) {
    this.status = "Paid";
  } else if (this.paidAmount > 0) {
    // If dueDate has passed and not fully paid, could be Overdue.
    // We'll keep it simple: if dueDate passed, mark Overdue, otherwise Partially Paid
    if (this.dueDate && new Date() > this.dueDate) {
      this.status = "Overdue";
    } else {
      this.status = "Partially Paid";
    }
  } else {
    if (this.dueDate && new Date() > this.dueDate) {
      this.status = "Overdue";
    } else {
      this.status = "Pending";
    }
  }
});

tuitionFeeSchema.set('toJSON', { virtuals: true });
tuitionFeeSchema.set('toObject', { virtuals: true });

const TuitionFee = mongoose.model("TuitionFee", tuitionFeeSchema);

module.exports = TuitionFee;
