const ClassJoinRequest = require("../models/ClassJoinRequest");
const Class = require("../models/Class");
const { createNotification } = require("../services/notificationService");

const User = require("../models/User");

// @desc    Create a join request
// @route   POST /api/class-requests
// @access  Private (Student only)
const createRequest = async (req, res) => {
  try {
    const { classId } = req.body;
    const studentId = req.user._id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (classData.status !== "active") {
      return res.status(400).json({ success: false, message: "Class is not active" });
    }

    if (classData.students.includes(studentId)) {
      return res.status(400).json({ success: false, message: "You are already a member of this class" });
    }

    const existingRequest = await ClassJoinRequest.findOne({ studentId, classId });
    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({ success: false, message: "You already have a pending request for this class" });
      }
      if (existingRequest.status === "approved") {
        return res.status(400).json({ success: false, message: "You are already approved for this class" });
      }
    }

    // Optional: Prevent requesting if they are already in another class or have a pending request
    const anyPending = await ClassJoinRequest.findOne({ studentId, status: "pending" });
    if (anyPending) {
      return res.status(400).json({ success: false, message: "You already have a pending request for a class" });
    }
    const anyApproved = await Class.findOne({ students: studentId });
    if (anyApproved) {
      return res.status(400).json({ success: false, message: "You are already a member of a class" });
    }

    const newRequest = await ClassJoinRequest.create({
      studentId,
      classId,
      status: "pending",
    });

    res.status(201).json({ success: true, message: "Join request sent", data: newRequest });

    createNotification({
      recipientId: classData.teacherId,
      senderId: studentId,
      type: "class_join_request",
      title: "New Join Request",
      message: `${req.user.name} wants to join ${classData.className}.`,
      relatedId: newRequest._id,
      relatedModel: "ClassJoinRequest"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's class join requests
// @route   GET /api/class-requests/my-classes
// @access  Private (Teacher only)
const getMyClassRequests = async (req, res) => {
  try {
    const classes = await Class.find(req.user.schoolId ? { schoolId: req.user.schoolId } : {}).select("_id");
    const classIds = classes.map((c) => c._id);

    const requests = await ClassJoinRequest.find({ classId: { $in: classIds }, status: "pending" })
      .populate("studentId", "name email")
      .populate("classId", "className standard section");

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve join request
// @route   PATCH /api/class-requests/:requestId/approve
// @access  Private (Teacher only)
const approveRequest = async (req, res) => {
  try {
    const request = await ClassJoinRequest.findById(req.params.requestId).populate("classId");
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Any teacher can approve class join requests

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request is already processed" });
    }

    request.status = "approved";
    request.reviewedAt = Date.now();
    request.reviewedBy = req.user._id;
    await request.save();

    const classData = await Class.findById(request.classId._id);
    if (!classData.students.includes(request.studentId)) {
      classData.students.push(request.studentId);
      await classData.save();
    }

    res.json({ success: true, message: "Request approved", data: request });

    createNotification({
      recipientId: request.studentId,
      senderId: req.user._id,
      type: "class_join_approved",
      title: "Class Request Approved",
      message: `You have been added to ${classData.className}.`,
      relatedId: request.classId._id,
      relatedModel: "Class"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject join request
// @route   PATCH /api/class-requests/:requestId/reject
// @access  Private (Teacher only)
const rejectRequest = async (req, res) => {
  try {
    const request = await ClassJoinRequest.findById(req.params.requestId).populate("classId");
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Any teacher can reject class join requests

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request is already processed" });
    }

    request.status = "rejected";
    request.reviewedAt = Date.now();
    request.reviewedBy = req.user._id;
    await request.save();

    res.json({ success: true, message: "Request rejected", data: request });

    createNotification({
      recipientId: request.studentId,
      senderId: req.user._id,
      type: "class_join_rejected",
      title: "Class Request Rejected",
      message: `Your request to join the class was rejected.`,
      relatedId: request.classId,
      relatedModel: "Class"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own requests
// @route   GET /api/class-requests/my-requests
// @access  Private (Student only)
const getMyRequests = async (req, res) => {
  try {
    const requests = await ClassJoinRequest.find({ studentId: req.user._id })
      .populate("classId", "className teacherId")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getMyClassRequests,
  approveRequest,
  rejectRequest,
  getMyRequests,
};
