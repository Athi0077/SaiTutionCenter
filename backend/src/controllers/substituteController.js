const SubstituteAssignment = require("../models/SubstituteAssignment");
const TeacherAttendance = require("../models/TeacherAttendance");
const Timetable = require("../models/Timetable");
const Class = require("../models/Class");
const User = require("../models/User");

// Helper to get day name
const getDayName = (dateString) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateString).getDay()];
};

// @desc    Get uncovered periods for a specific date
// @route   GET /api/substitutes/uncovered?date=YYYY-MM-DD
// @access  Private (Principal)
const getUncoveredPeriods = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dayName = getDayName(date);

    console.log("Selected Date:", date);
    console.log("Calculated Weekday:", dayName);

    // 1. Find teachers on leave for this date
    const teachersOnLeave = await TeacherAttendance.find({
      date: targetDate,
      status: { $in: ["leave", "absent"] },
    }).select("teacherId");

    const leaveTeacherIds = teachersOnLeave.map((t) => t.teacherId.toString());

    if (leaveTeacherIds.length === 0) {
      console.log("No teachers on leave for this date.");
      return res.json({ success: true, data: [] });
    }

    console.log("Teachers on leave:", leaveTeacherIds);

    // 2. Find timetable periods for these teachers on this day of the week
    const timetables = await Timetable.find({
      "periods": {
        $elemMatch: {
          subjectTeacherId: { $in: leaveTeacherIds },
          day: dayName
        }
      }
    })
      .populate("classId", "className standard section")
      .populate("periods.subjectTeacherId", "name profilePic");

    console.log("Timetables found:", timetables.length);

    // 3. Find existing substitute assignments for this date
    const existingAssignments = await SubstituteAssignment.find({ date })
      .populate("substituteTeacherId", "name profilePic");

    const assignmentsMap = {};
    existingAssignments.forEach((assign) => {
      assignmentsMap[`${assign.timetableId.toString()}-${assign.periodNumber}`] = assign;
    });

    // 4. Combine into result array
    const uncoveredPeriods = [];

    timetables.forEach((tt) => {
      tt.periods.forEach((p) => {
        if (p.day === dayName && p.subjectTeacherId && leaveTeacherIds.includes(p.subjectTeacherId._id.toString())) {
          const assignmentKey = `${tt._id.toString()}-${p.periodNumber}`;
          const assignment = assignmentsMap[assignmentKey];
          
          uncoveredPeriods.push({
            timetableId: tt._id,
            originalTeacher: p.subjectTeacherId,
            class: tt.classId,
            section: tt.classId ? tt.classId.sectionId : null,
            subject: p.subjectId,
            periodNumber: p.periodNumber,
            startTime: p.startTime,
            endTime: p.endTime,
            date: date,
            status: assignment ? (assignment.status === "COMPLETED" ? "COMPLETED" : "ASSIGNED") : "REQUIRED",
            substituteAssignment: assignment || null,
          });
        }
      });
    });

    console.log("Uncovered periods returned:", uncoveredPeriods.length);

    res.json({ success: true, data: uncoveredPeriods });
  } catch (error) {
    console.error("Error in getUncoveredPeriods:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign a substitute
// @route   POST /api/substitutes
// @access  Private (Principal)
const assignSubstitute = async (req, res) => {
  try {
    const {
      originalTeacherId,
      substituteTeacherId,
      classId,
      sectionId,
      subjectId,
      timetableId,
      date,
      periodNumber,
      startTime,
      endTime,
      reason,
    } = req.body;

    // Validate inputs
    if (!substituteTeacherId || !timetableId || !date) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validation 1: Prevent double booking
    // Check if substitute is already assigned to a regular timetable at this time/day
    const dayName = getDayName(date);
    const existingTimetable = await Timetable.findOne({
      "periods": {
        $elemMatch: {
          subjectTeacherId: substituteTeacherId,
          day: dayName,
          periodNumber: periodNumber
        }
      }
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: "Substitute teacher is already assigned to a regular class during this period.",
      });
    }

    // Check if substitute is already assigned to another substitute session
    const existingSub = await SubstituteAssignment.findOne({
      substituteTeacherId,
      date,
      periodNumber,
      status: "ASSIGNED",
    });

    if (existingSub) {
      return res.status(400).json({
        success: false,
        message: "Substitute teacher is already assigned as a substitute during this period.",
      });
    }

    // Validation 2: Check if this period already has a substitute
    const existingAssignment = await SubstituteAssignment.findOne({
      timetableId,
      date,
      status: { $in: ["ASSIGNED", "COMPLETED"] },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "A substitute is already assigned for this period.",
        data: existingAssignment,
      });
    }

    const assignment = await SubstituteAssignment.create({
      originalTeacherId,
      substituteTeacherId,
      classId,
      sectionId,
      subjectId,
      timetableId,
      date,
      periodNumber,
      reason: reason || "STAFF_LEAVE",
      status: "ASSIGNED",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Substitute assigned successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reassign or Cancel substitute
// @route   PUT /api/substitutes/:id
// @access  Private (Principal)
const updateSubstitute = async (req, res) => {
  try {
    const { substituteTeacherId, status } = req.body;
    const assignment = await SubstituteAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Substitute assignment not found" });
    }

    if (assignment.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Cannot modify a completed substitute session." });
    }

    if (status === "CANCELLED") {
      assignment.status = "CANCELLED";
    } else if (substituteTeacherId) {
      // Reassign validation
      const dayName = getDayName(assignment.date);
      const existingTimetable = await Timetable.findOne({
        "periods": {
          $elemMatch: {
            subjectTeacherId: substituteTeacherId,
            day: dayName,
            periodNumber: assignment.periodNumber
          }
        }
      });

      if (existingTimetable) {
        return res.status(400).json({
          success: false,
          message: "New substitute teacher is already assigned to a regular class during this period.",
        });
      }

      const existingSub = await SubstituteAssignment.findOne({
        substituteTeacherId,
        date: assignment.date,
        periodNumber: assignment.periodNumber,
        status: "ASSIGNED",
      });

      if (existingSub && existingSub._id.toString() !== assignment._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "New substitute teacher is already assigned as a substitute during this period.",
        });
      }

      assignment.substituteTeacherId = substituteTeacherId;
    }

    await assignment.save();
    res.json({ success: true, message: "Substitute assignment updated", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUncoveredPeriods,
  assignSubstitute,
  updateSubstitute,
};
