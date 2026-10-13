const TuitionFee = require("../models/TuitionFee");
const User = require("../models/User");
const FeeStatus = require("../models/FeeStatus");
const { createNotification } = require("../services/notificationService");
const { checkAndRolloverFees } = require("../services/feeCycleScheduler");

// @desc    Create a new fee record
// @route   POST /api/tuition-fees
// @access  Private (Admin/Principal)
const createFee = async (req, res) => {
  try {
    const { studentId, batchId, feeType, feePeriod, feeDetails, totalAmount, billingPeriod, dueDate, remarks } = req.body;
    
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = now.getFullYear();
    const period = feePeriod === "Yearly" ? "Yearly" : "Monthly";

    const fee = new TuitionFee({
      studentId,
      batchId,
      feeType,
      feePeriod: period,
      feeDetails: feeDetails || (period === "Yearly" ? "Yearly Tuition Fee" : "Monthly Tuition Fee"),
      totalAmount,
      billingPeriod,
      dueDate,
      remarks,
      status: "PENDING",
      lastBilledMonth: currentMonthKey,
      lastBilledYear: currentYear,
      lastResetDate: now
    });

    await fee.save();

    // Sync FeeStatus
    await FeeStatus.updateMany(
      { studentId },
      {
        $set: {
          feeStatus: "pending",
          feePeriod: period,
          lastBilledMonth: currentMonthKey,
          lastBilledYear: currentYear,
          lastResetDate: now,
          statusUpdatedAt: now
        }
      }
    );

    await createNotification({
      recipientId: studentId,
      senderId: req.user._id,
      type: "general",
      title: "New Tuition Fee Generated",
      message: `A new fee of ₹${totalAmount} has been added for ${feeType || period}.`,
      relatedId: fee._id,
      relatedModel: "TuitionFee"
    });

    res.status(201).json({ success: true, message: "Fee record created successfully", data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all fee records
// @route   GET /api/tuition-fees
// @access  Private (Admin/Principal)
const getFees = async (req, res) => {
  try {
    // Automatically evaluate rollover if new month/year started
    await checkAndRolloverFees();

    const { batchId, studentId, status } = req.query;
    let filter = {};
    if (batchId) filter.batchId = batchId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const fees = await TuitionFee.find(filter)
      .populate("studentId", "name rollNumber studentId")
      .populate("batchId", "batchName")
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a payment
// @route   POST /api/tuition-fees/:id/pay
// @access  Private (Admin/Principal)
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, remarks } = req.body;

    const fee = await TuitionFee.findById(id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });

    if (fee.paidAmount + Number(amount) > fee.totalAmount) {
      return res.status(400).json({ success: false, message: "Payment amount exceeds total fee amount" });
    }

    fee.paidAmount += Number(amount);
    fee.paymentHistory.push({
      amount: Number(amount),
      method,
      remarks,
      date: new Date()
    });

    await fee.save();
    res.json({ success: true, message: "Payment recorded successfully", data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fees for current student or parent's child
// @route   GET /api/tuition-fees/my-fees
// @access  Private (Student/Parent)
const getMyFees = async (req, res) => {
  try {
    await checkAndRolloverFees();

    let studentId = req.user._id;

    if (req.user.role === 'parent') {
      // Find the child
      const child = await User.findOne({ parentId: req.user._id, role: 'student' });
      if (!child) return res.status(404).json({ success: false, message: "Child not found for this parent" });
      studentId = child._id;
    }

    const fees = await TuitionFee.find({ studentId })
      .populate("batchId", "batchName")
      .sort({ dueDate: -1, createdAt: -1 });

    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feeAmount, feeDetails, feePeriod } = req.body;

    const fee = await TuitionFee.findById(id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });

    if (status) fee.status = status;
    if (feeAmount !== undefined && feeAmount !== '') fee.totalAmount = Number(feeAmount);
    if (feeDetails !== undefined) fee.feeDetails = feeDetails;
    if (feePeriod !== undefined) fee.feePeriod = feePeriod;

    await fee.save();

    // Sync FeeStatus for this student
    if (status) {
      await FeeStatus.updateMany(
        { studentId: fee.studentId },
        {
          $set: {
            feeStatus: status.toLowerCase() === "completed" ? "completed" : "pending",
            feePeriod: fee.feePeriod || "Monthly",
            statusUpdatedAt: new Date(),
            updatedBy: req.user._id
          }
        }
      );
    }

    res.json({ success: true, message: "Fee updated successfully", data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFee,
  getFees,
  recordPayment,
  getMyFees,
  updateFeeStatus
};
