const TuitionSession = require("../models/TuitionSession");
const Section = require("../models/Section");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Standard = require("../models/Standard");

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const {
      batchId,
      subjectId,
      teacherId,
      dayOfWeek,
      sessionDate,
      startTime,
      endTime,
      room,
      sessionType
    } = req.body;

    const session = new TuitionSession({
      batchId,
      subjectId,
      teacherId,
      dayOfWeek,
      sessionDate,
      startTime,
      endTime,
      room,
      sessionType: sessionType || "recurring",
      createdBy: req.user._id,
    });

    const createdSession = await session.save();
    res.status(201).json(createdSession);
  } catch (error) {
    res.status(500).json({ message: "Error creating session", error: error.message });
  }
};

// Get all sessions
exports.getSessions = async (req, res) => {
  try {
    // Optional filters via query params
    const { batchId, teacherId, dayOfWeek } = req.query;
    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (teacherId) filter.teacherId = teacherId;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek;

    const sessions = await TuitionSession.find(filter)
      .populate({
        path: "batchId",
        select: "name standardId",
        populate: { path: "standardId", select: "name" }
      })
      .populate("subjectId", "name code")
      .populate("teacherId", "name email")
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sessions", error: error.message });
  }
};

// Get a single session
exports.getSessionById = async (req, res) => {
  try {
    const session = await TuitionSession.findById(req.params.id)
      .populate({
        path: "batchId",
        select: "name standardId",
        populate: { path: "standardId", select: "name" }
      })
      .populate("subjectId", "name code")
      .populate("teacherId", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Error fetching session", error: error.message });
  }
};

// Update a session
exports.updateSession = async (req, res) => {
  try {
    const session = await TuitionSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      session[key] = updates[key];
    });

    const updatedSession = await session.save();
    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: "Error updating session", error: error.message });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const session = await TuitionSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await session.deleteOne();
    res.json({ message: "Session removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting session", error: error.message });
  }
};
