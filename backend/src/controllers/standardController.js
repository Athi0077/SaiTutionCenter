const Standard = require("../models/Standard");
const Section = require("../models/Section");
const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
const User = require("../models/User");

// --- STANDARDS ---

exports.createStandard = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Standard name is required" });

    const standardExists = await Standard.findOne({ name });
    if (standardExists) return res.status(400).json({ success: false, message: "Standard already exists" });

    const standard = await Standard.create({ name, createdBy: req.user._id });

    // Also ensure a Class document exists for this standard (since sections are removed)
    await Class.findOneAndUpdate(
      { $or: [{ standardId: standard._id }, { standard: name }] },
      {
        $setOnInsert: {
          standard: name,
          standardId: standard._id,
          className: name,
          status: "active",
          students: [],
          subjects: []
        }
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: "Standard created successfully", data: standard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStandards = async (req, res) => {
  try {
    const standards = await Standard.find().populate("createdBy", "name");
    // Also fetch sections with enrolled students for convenience
    const standardsWithSections = await Promise.all(standards.map(async (std) => {
      const sections = await Section.find({ standardId: std._id });
      const sectionsWithStudents = await Promise.all(sections.map(async (sec) => {
        const cls = await Class.findOne({ 
          $or: [
            { sectionId: sec._id },
            { standard: std.name, section: sec.name },
            { className: `${std.name} - ${sec.name}` }
          ]
        }).populate("students", "name email studentId rollNumber role");
        const validStudents = (cls?.students || []).filter(s => s && s.role === 'student');
        return { ...sec.toObject(), students: validStudents };
      }));
      return { ...std.toObject(), sections: sectionsWithStudents };
    }));
    res.json({ success: true, data: standardsWithSections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStandard = async (req, res) => {
  try {
    const { name } = req.body;
    const standard = await Standard.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!standard) return res.status(404).json({ success: false, message: "Standard not found" });
    res.json({ success: true, message: "Standard updated", data: standard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStandard = async (req, res) => {
  try {
    const standard = await Standard.findById(req.params.id);
    if (!standard) return res.status(404).json({ success: false, message: "Standard not found" });

    // Find all sections for this standard
    const sections = await Section.find({ standardId: standard._id });
    const sectionIds = sections.map(s => s._id);

    // Delete corresponding Class documents and Teacher Assignments
    for (const sec of sections) {
      await Class.findOneAndDelete({ standard: standard.name, section: sec.name });
      await TeacherAssignment.deleteMany({ sectionId: sec._id });
    }

    // Delete all sections
    await Section.deleteMany({ standardId: standard._id });

    // Delete the standard itself
    await Standard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Standard and its sections deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SECTIONS ---

exports.createSection = async (req, res) => {
  try {
    const { name, standardId } = req.body;
    if (!name || !standardId) return res.status(400).json({ success: false, message: "Name and Standard ID are required" });

    const standardExists = await Standard.findById(standardId);
    if (!standardExists) return res.status(404).json({ success: false, message: "Standard not found" });

    const sectionExists = await Section.findOne({ name, standardId });
    if (sectionExists) return res.status(400).json({ success: false, message: "Section already exists in this standard" });

    const section = await Section.create({ name, standardId, createdBy: req.user._id });

    // Also create the Class representation so students can register for it
    await Class.create({
      standard: standardExists.name,
      section: name,
      className: `${standardExists.name} - ${name}`,
      status: "active",
      subjects: []
    });

    res.status(201).json({ success: true, message: "Section created successfully", data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { name } = req.body;
    const section = await Section.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    res.json({ success: true, message: "Section updated", data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    // Also delete the corresponding Class document and Teacher Assignment
    const StandardModel = require("../models/Standard");
    const standard = await StandardModel.findById(section.standardId);
    if (standard) {
      await Class.findOneAndDelete({ 
        standard: standard.name, 
        section: section.name 
      });
    }

    await TeacherAssignment.deleteMany({ sectionId: section._id });

    await Section.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Section deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
