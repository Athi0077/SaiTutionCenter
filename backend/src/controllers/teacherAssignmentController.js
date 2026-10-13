const TeacherAssignment = require("../models/TeacherAssignment");
const Standard = require("../models/Standard");
const Section = require("../models/Section");
const User = require("../models/User");
const Class = require("../models/Class");
const { createNotification } = require("../services/notificationService");

exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId, standardId, sectionId, subjectId, isClassTeacher } = req.body;

    if (!teacherId || !standardId || !sectionId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher" || teacher.status !== "active") {
      return res.status(400).json({ success: false, message: "Invalid or unapproved teacher" });
    }

    const standard = await Standard.findById(standardId);
    const section = await Section.findOne({ _id: sectionId, standardId });

    if (!standard || !section) {
      return res.status(400).json({ success: false, message: "Invalid standard or section" });
    }

    // Any teacher can be assigned to the standard and section without Class Teacher exclusivity

    // Check if assignment already exists
    const exists = await TeacherAssignment.findOne({ teacherId, standardId, sectionId });
    if (exists) {
      return res.status(400).json({ success: false, message: "Teacher is already assigned to this standard and section" });
    }

    let subjectName = "";
    if (subjectId) {
      const Subject = require("../models/Subject");
      const subjectDoc = await Subject.findById(subjectId);
      if (subjectDoc) {
        subjectName = subjectDoc.name;
      }
    }

    const assignment = await TeacherAssignment.create({
      teacherId,
      standardId,
      sectionId,
      subject: subjectName,
      subjectId,
      isClassTeacher: Boolean(isClassTeacher),
      assignedBy: req.user._id
    });

    // Sync with existing Class model for backwards compatibility
    const className = `${standard.name} - ${section.name}`;
    let existingClass = await Class.findOne({ standardId, sectionId });
    if (!existingClass) {
      existingClass = await Class.findOne({ className });
    }
    if (!existingClass) {
      existingClass = await Class.create({
        standard: standard.name,
        standardId,
        section: section.name,
        sectionId,
        className,
        teacherId,
        status: "active",
        subjects: []
      });
    } else {
      existingClass.standardId = standardId;
      existingClass.sectionId = sectionId;
      if (isClassTeacher) {
        existingClass.teacherId = teacherId;
      }
      await existingClass.save();
    }

    if (subjectId) {
      if (!existingClass.subjects.includes(subjectId)) {
        existingClass.subjects.push(subjectId);
        await existingClass.save();
      }
    }

    await createNotification({
      recipientId: teacherId,
      senderId: req.user._id,
      type: "class_assigned",
      title: "Class Assigned",
      message: `You have been assigned to ${className} for subject: ${subjectName || "General"}`
    });

    res.status(201).json({ success: true, message: "Teacher assigned successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await TeacherAssignment.find()
      .populate("teacherId", "name email")
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name")
      .populate("assignedBy", "name");
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const assignments = await TeacherAssignment.find({ teacherId })
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name");
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id)
      .populate("standardId")
      .populate("sectionId");
      
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const className = `${assignment.standardId.name} - ${assignment.sectionId.name}`;
    
    if (assignment.isClassTeacher) {
      await Class.findOneAndUpdate(
        { className, teacherId: assignment.teacherId },
        { $unset: { teacherId: 1 } }
      );
    }

    await TeacherAssignment.findByIdAndDelete(req.params.id);

    await createNotification({
      recipientId: assignment.teacherId,
      senderId: req.user._id,
      type: "class_removed",
      title: "Class Removed",
      message: `You have been removed from ${className}`
    });

    res.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { teacherId, standardId, sectionId, subjectId, isClassTeacher } = req.body;
    const assignmentId = req.params.id;

    if (!teacherId || !standardId || !sectionId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const assignment = await TeacherAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const standard = await Standard.findById(standardId);
    const section = await Section.findOne({ _id: sectionId, standardId });
    if (!standard || !section) {
      return res.status(400).json({ success: false, message: "Invalid standard or section" });
    }

    // Any teacher can be assigned without Class Teacher exclusivity

    const exists = await TeacherAssignment.findOne({ 
      teacherId, 
      standardId, 
      sectionId,
      _id: { $ne: assignmentId }
    });
    if (exists) {
      return res.status(400).json({ success: false, message: "Teacher is already assigned to this class." });
    }

    // Cleanup old class logic if standard/section changed
    const oldClassName = `${(await Standard.findById(assignment.standardId)).name} - ${(await Section.findById(assignment.sectionId)).name}`;
    if (assignment.isClassTeacher) {
       await Class.findOneAndUpdate(
         { className: oldClassName, teacherId: assignment.teacherId },
         { $unset: { teacherId: 1 } }
       );
    }

    let subjectName = "";
    if (subjectId) {
      const Subject = require("../models/Subject");
      const subjectDoc = await Subject.findById(subjectId);
      if (subjectDoc) {
        subjectName = subjectDoc.name;
      }
    }

    // Update assignment
    assignment.teacherId = teacherId;
    assignment.standardId = standardId;
    assignment.sectionId = sectionId;
    assignment.subject = subjectName;
    assignment.subjectId = subjectId;
    assignment.isClassTeacher = Boolean(isClassTeacher);
    await assignment.save();

    // Sync with existing Class model for backwards compatibility
    const className = `${standard.name} - ${section.name}`;
    let existingClass = await Class.findOne({ standardId, sectionId });
    if (!existingClass) {
      existingClass = await Class.findOne({ className });
    }
    if (!existingClass) {
      existingClass = await Class.create({
        standard: standard.name,
        standardId,
        section: section.name,
        sectionId,
        className,
        teacherId,
        status: "active",
        subjects: []
      });
    } else {
      existingClass.standardId = standardId;
      existingClass.sectionId = sectionId;
      if (isClassTeacher) {
        existingClass.teacherId = teacherId;
      }
      await existingClass.save();
    }

    if (subjectId) {
      if (!existingClass.subjects.includes(subjectId)) {
        existingClass.subjects.push(subjectId);
        await existingClass.save();
      }
    }

    res.json({ success: true, message: "Assignment updated successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

