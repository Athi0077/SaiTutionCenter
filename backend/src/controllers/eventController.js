const SchoolEvent = require("../models/SchoolEvent");
const EventRegistration = require("../models/EventRegistration");
const EventResult = require("../models/EventResult");
const Class = require("../models/Class");
const User = require("../models/User");
const EventGallery = require("../models/EventGallery");
const { cloudinary } = require("../middleware/uploadMiddleware");

// ═══════════════════════════════════════════
// PRINCIPAL ENDPOINTS
// ═══════════════════════════════════════════

// @desc    Create a new school event
// @route   POST /api/events
// @access  Private (Principal)
const createEvent = async (req, res) => {
  try {
    const { title, category, topic, subtopic, description, posterUrl, eventDate, startTime, endTime, venue, registrationDeadline, eligibleClasses, participantLimit } = req.body;

    if (!title || !category || !topic || !eventDate || !venue || !registrationDeadline) {
      return res.status(400).json({ success: false, message: "Title, category, topic, event date, venue, and registration deadline are required" });
    }

    const event = await SchoolEvent.create({
      title, category, topic, subtopic, description, posterUrl,
      eventDate, startTime, endTime, venue, registrationDeadline,
      eligibleClasses: eligibleClasses || [],
      participantLimit: participantLimit || 0,
      status: "draft",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Event created as draft", data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Principal)
const updateEvent = async (req, res) => {
  try {
    const event = await SchoolEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (event.status === "cancelled") return res.status(400).json({ success: false, message: "Cannot edit a cancelled event" });
    if (event.status === "completed") return res.status(400).json({ success: false, message: "Cannot edit a completed event" });

    const allowedFields = ["title", "category", "topic", "subtopic", "description", "posterUrl", "eventDate", "startTime", "endTime", "venue", "registrationDeadline", "eligibleClasses", "participantLimit"];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });
    event.updatedBy = req.user._id;
    await event.save();

    // Emit socket event if published
    if (event.status === "published") {
      try {
        const { getIo } = require("../utils/socket");
        getIo().to("role:teacher").to("role:student").emit("event:updated", { eventId: event._id });
      } catch (e) { /* socket not available in test */ }
    }

    res.json({ success: true, message: "Event updated", data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish/unpublish an event
// @route   PUT /api/events/:id/status
// @access  Private (Principal)
const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const event = await SchoolEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const validTransitions = {
      draft: ["published", "cancelled"],
      published: ["draft", "completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[event.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change status from '${event.status}' to '${status}'` });
    }

    event.status = status;
    event.updatedBy = req.user._id;
    if (status === "published") event.publishedAt = new Date();
    if (status === "completed") event.completedAt = new Date();
    if (status === "cancelled") event.cancelledAt = new Date();
    await event.save();

    // Emit socket event
    try {
      const { getIo } = require("../utils/socket");
      if (status === "published") {
        getIo().to("role:teacher").to("role:student").emit("event:published", { eventId: event._id, title: event.title });
      } else if (status === "cancelled") {
        getIo().to("role:teacher").to("role:student").emit("event:cancelled", { eventId: event._id, title: event.title });
      } else if (status === "completed") {
        getIo().to("role:teacher").to("role:student").emit("event:completed", { eventId: event._id, title: event.title });
      }
    } catch (e) { /* socket not available in test */ }

    res.json({ success: true, message: `Event status changed to '${status}'`, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all events (principal view — includes drafts)
// @route   GET /api/events/all
// @access  Private (Principal)
const getAllEvents = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const events = await SchoolEvent.find(filter).sort({ eventDate: -1 }).lean();

    // Attach participant counts
    const eventIds = events.map(e => e._id);
    const counts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const enriched = events.map(e => ({ ...e, participantCount: countMap[e._id.toString()] || 0 }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await SchoolEvent.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Non-principal users can only see published/completed events
    if (req.user.role !== "principal" && !["published", "completed"].includes(event.status)) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const participantCount = await EventRegistration.countDocuments({ eventId: event._id });
    event.participantCount = participantCount;

    // Check if the requesting student has registered
    if (req.user.role === "student") {
      const reg = await EventRegistration.findOne({ eventId: event._id, studentId: req.user._id });
      event.isRegistered = !!reg;
    }

    // Include published results
    const result = await EventResult.findOne({ eventId: event._id, resultStatus: "published" })
      .populate("firstPlace", "name studentId")
      .populate("secondPlace", "name studentId")
      .populate("thirdPlace", "name studentId");
    event.publishedResult = result || null;

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════
// PUBLISHED EVENTS (Teacher + Student)
// ═══════════════════════════════════════════

// @desc    Get published events
// @route   GET /api/events
// @access  Private (Teacher, Student)
const getPublishedEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: { $in: ["published", "completed"] } };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const events = await SchoolEvent.find(filter).sort({ eventDate: -1 }).lean();

    // Filter by student eligibility
    let filteredEvents = events;
    if (req.user.role === "student") {
      const studentClass = await Class.findOne({ students: req.user._id });
      if (studentClass) {
        filteredEvents = events.filter(e =>
          !e.eligibleClasses || e.eligibleClasses.length === 0 || e.eligibleClasses.includes(studentClass.className)
        );
      } else {
        filteredEvents = events.filter(e => !e.eligibleClasses || e.eligibleClasses.length === 0);
      }
    }

    // Attach participant counts
    const eventIds = filteredEvents.map(e => e._id);
    const counts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    // Check student registrations
    let regMap = {};
    if (req.user.role === "student") {
      const regs = await EventRegistration.find({ eventId: { $in: eventIds }, studentId: req.user._id });
      regs.forEach(r => { regMap[r.eventId.toString()] = true; });
    }

    // Attach published results
    const results = await EventResult.find({ eventId: { $in: eventIds }, resultStatus: "published" })
      .populate("firstPlace", "name studentId")
      .populate("secondPlace", "name studentId")
      .populate("thirdPlace", "name studentId");
    const resultMap = {};
    results.forEach(r => { resultMap[r.eventId.toString()] = r; });

    const enriched = filteredEvents.map(e => ({
      ...e,
      participantCount: countMap[e._id.toString()] || 0,
      isRegistered: regMap[e._id.toString()] || false,
      publishedResult: resultMap[e._id.toString()] || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════
// STUDENT REGISTRATION
// ═══════════════════════════════════════════

// @desc    Student joins an event
// @route   POST /api/events/:id/join
// @access  Private (Student)
const joinEvent = async (req, res) => {
  try {
    const event = await SchoolEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (event.status !== "published") return res.status(400).json({ success: false, message: "Cannot join this event — it is not open for registration" });
    if (new Date() > new Date(event.registrationDeadline)) return res.status(400).json({ success: false, message: "Registration deadline has passed" });

    // Check eligibility
    if (event.eligibleClasses && event.eligibleClasses.length > 0) {
      const studentClass = await Class.findOne({ students: req.user._id });
      if (!studentClass || !event.eligibleClasses.includes(studentClass.className)) {
        return res.status(403).json({ success: false, message: "You are not eligible for this event" });
      }
    }

    // Check participant limit
    if (event.participantLimit > 0) {
      const currentCount = await EventRegistration.countDocuments({ eventId: event._id });
      if (currentCount >= event.participantLimit) {
        return res.status(400).json({ success: false, message: "This event has reached its participant limit" });
      }
    }

    // Check duplicate
    const existing = await EventRegistration.findOne({ eventId: event._id, studentId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "You have already registered for this event" });

    await EventRegistration.create({ eventId: event._id, studentId: req.user._id });

    res.status(201).json({ success: true, message: "Successfully registered for the event" });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Already registered" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════
// PARTICIPANT LIST (Teacher / Principal)
// ═══════════════════════════════════════════

// @desc    Get participants for an event
// @route   GET /api/events/:id/participants
// @access  Private (Teacher, Principal)
const getEventParticipants = async (req, res) => {
  try {
    const event = await SchoolEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate("studentId", "name studentId email")
      .sort({ registeredAt: 1 });

    // Enrich with class info
    const participants = await Promise.all(registrations.map(async (reg) => {
      const studentClass = await Class.findOne({ students: reg.studentId._id });
      return {
        _id: reg._id,
        student: {
          _id: reg.studentId._id,
          name: reg.studentId.name,
          studentId: reg.studentId.studentId,
        },
        className: studentClass ? studentClass.className : "N/A",
        registeredAt: reg.registeredAt,
      };
    }));

    res.json({ success: true, data: participants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════
// RESULTS (Teacher submit, Principal approve)
// ═══════════════════════════════════════════

// @desc    Teacher submits results for a completed event
// @route   POST /api/events/:id/results
// @access  Private (Teacher)
const submitResults = async (req, res) => {
  try {
    const { firstPlace, secondPlace, thirdPlace } = req.body;
    const event = await SchoolEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (event.status !== "completed") return res.status(400).json({ success: false, message: "Results can only be submitted for completed events" });

    // Validate winners are registered participants
    const winnerIds = [firstPlace, secondPlace, thirdPlace].filter(Boolean);
    if (winnerIds.length === 0) return res.status(400).json({ success: false, message: "At least one winner must be specified" });

    // Check for duplicate positions
    const uniqueWinners = new Set(winnerIds);
    if (uniqueWinners.size !== winnerIds.length) {
      return res.status(400).json({ success: false, message: "The same student cannot occupy multiple winning positions" });
    }

    for (const wId of winnerIds) {
      const reg = await EventRegistration.findOne({ eventId: event._id, studentId: wId });
      if (!reg) return res.status(400).json({ success: false, message: `Student ${wId} is not a registered participant` });
    }

    const existing = await EventResult.findOne({ eventId: event._id });
    if (existing && existing.resultStatus === "published") {
      return res.status(400).json({ success: false, message: "Results have already been published" });
    }

    const resultData = {
      firstPlace: firstPlace || null,
      secondPlace: secondPlace || null,
      thirdPlace: thirdPlace || null,
      resultStatus: "submitted",
      submittedBy: req.user._id,
      submittedAt: new Date(),
      returnNote: "",
    };

    let result;
    if (existing) {
      Object.assign(existing, resultData);
      result = await existing.save();
    } else {
      result = await EventResult.create({ eventId: event._id, ...resultData });
    }

    res.json({ success: true, message: "Results submitted for approval", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get results for an event
// @route   GET /api/events/:id/results
// @access  Private
const getResults = async (req, res) => {
  try {
    const result = await EventResult.findOne({ eventId: req.params.id })
      .populate("firstPlace", "name studentId")
      .populate("secondPlace", "name studentId")
      .populate("thirdPlace", "name studentId")
      .populate("submittedBy", "name")
      .populate("approvedBy", "name");

    if (!result) return res.json({ success: true, data: null });

    // Non-principal users can only see published results
    if (req.user.role !== "principal" && req.user.role !== "teacher" && result.resultStatus !== "published") {
      return res.json({ success: true, data: null });
    }

    // Teachers can see submitted/returned/published but students only published
    if (req.user.role === "student" && result.resultStatus !== "published") {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Principal approves/returns/publishes results
// @route   PUT /api/events/:id/results/review
// @access  Private (Principal)
const reviewResults = async (req, res) => {
  try {
    const { action, returnNote, firstPlace, secondPlace, thirdPlace } = req.body;
    const result = await EventResult.findOne({ eventId: req.params.id });
    if (!result) return res.status(404).json({ success: false, message: "No results found for this event" });

    if (action === "return") {
      if (!["submitted"].includes(result.resultStatus)) {
        return res.status(400).json({ success: false, message: "Can only return submitted results" });
      }
      result.resultStatus = "returned";
      result.returnNote = returnNote || "";
      await result.save();
      return res.json({ success: true, message: "Results returned to teacher", data: result });
    }

    if (action === "approve") {
      if (!["submitted"].includes(result.resultStatus)) {
        return res.status(400).json({ success: false, message: "Can only approve submitted results" });
      }
      result.resultStatus = "approved";
      result.approvedBy = req.user._id;
      result.approvedAt = new Date();
      await result.save();
      return res.json({ success: true, message: "Results approved", data: result });
    }

    if (action === "publish") {
      if (!["approved", "submitted"].includes(result.resultStatus)) {
        return res.status(400).json({ success: false, message: "Can only publish approved or submitted results" });
      }

      // Allow principal to override winners on publish
      if (firstPlace !== undefined) result.firstPlace = firstPlace || null;
      if (secondPlace !== undefined) result.secondPlace = secondPlace || null;
      if (thirdPlace !== undefined) result.thirdPlace = thirdPlace || null;

      // Validate no duplicate positions
      const winnerIds = [result.firstPlace, result.secondPlace, result.thirdPlace].filter(Boolean).map(String);
      if (new Set(winnerIds).size !== winnerIds.length) {
        return res.status(400).json({ success: false, message: "Same student cannot occupy multiple positions" });
      }

      result.resultStatus = "published";
      result.approvedBy = req.user._id;
      result.approvedAt = new Date();
      result.publishedAt = new Date();
      await result.save();

      // Notify participants
      try {
        const { getIo } = require("../utils/socket");
        const event = await SchoolEvent.findById(req.params.id);
        getIo().to("role:teacher").to("role:student").emit("event:results_published", { eventId: req.params.id, title: event?.title });
      } catch (e) { /* socket not in test */ }

      return res.json({ success: true, message: "Results published", data: result });
    }

    return res.status(400).json({ success: false, message: "Invalid action. Use 'approve', 'return', or 'publish'" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get events with pending results for principal review
// @route   GET /api/events/pending-results
// @access  Private (Principal)
const getPendingResults = async (req, res) => {
  try {
    const results = await EventResult.find({ resultStatus: { $in: ["submitted", "approved"] } })
      .populate("firstPlace", "name studentId")
      .populate("secondPlace", "name studentId")
      .populate("thirdPlace", "name studentId")
      .populate("submittedBy", "name");

    const eventIds = results.map(r => r.eventId);
    const events = await SchoolEvent.find({ _id: { $in: eventIds } }).lean();
    const eventMap = {};
    events.forEach(e => { eventMap[e._id.toString()] = e; });

    const enriched = results.map(r => ({
      ...r.toObject(),
      event: eventMap[r.eventId.toString()] || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════
// EVENT GALLERY
// ═══════════════════════════════════════════

// @desc    Upload event photo
// @route   POST /api/events/gallery
// @access  Private (Principal)
const uploadEventPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }
    
    const photo = await EventGallery.create({
      imageUrl: req.file.path,
      description: req.body.description || "",
      createdBy: req.user._id,
    });
    
    res.status(201).json({ success: true, message: "Photo added to gallery", data: photo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete event photo
// @route   DELETE /api/events/gallery/:id
// @access  Private (Principal)
const deleteEventPhoto = async (req, res) => {
  try {
    const photo = await EventGallery.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }
    
    // Extract public id from Cloudinary URL and delete it
    // Example url: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
    const urlParts = photo.imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    
    // delete from cloudinary
    if (folder && publicId) {
      try {
        await cloudinary.uploader.destroy(`${folder}/${publicId}`);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }
    
    await EventGallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Photo deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all event photos
// @route   GET /api/events/gallery
// @access  Private
const getAllEventPhotos = async (req, res) => {
  try {
    const photos = await EventGallery.find().sort({ createdAt: -1 });
    res.json({ success: true, data: photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEvent, updateEvent, updateEventStatus, getAllEvents, getEventById,
  getPublishedEvents, joinEvent, getEventParticipants,
  submitResults, getResults, reviewResults, getPendingResults,
  uploadEventPhoto, deleteEventPhoto, getAllEventPhotos,
};
