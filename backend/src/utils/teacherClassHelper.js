const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
require("../models/Standard");
require("../models/Section");

/**
 * Returns a MongoDB query that matches any classes belonging to a teacher:
 * either where teacherId === req.user._id, or where the teacher is assigned
 * to the class via TeacherAssignment (matching standardId & sectionId, or standard name & section name).
 */
const getTeacherClassQuery = async (teacherId) => {
  const assignments = await TeacherAssignment.find({ teacherId })
    .populate("standardId")
    .populate("sectionId");

  const classConditions = assignments.map((a) => {
    return [
      { standardId: a.standardId?._id, sectionId: a.sectionId?._id },
      { standard: a.standardId?.name, section: a.sectionId?.name },
    ];
  }).flat().filter((c) => (c.standardId && c.sectionId) || (c.standard && c.section));

  if (classConditions.length > 0) {
    return {
      $or: [
        { teacherId: teacherId },
        ...classConditions,
      ],
    };
  }
  return { teacherId: teacherId };
};

/**
 * Returns all Class documents for a given teacher.
 */
const getTeacherClasses = async (teacherId, projection = null) => {
  const query = await getTeacherClassQuery(teacherId);
  if (projection) {
    return Class.find(query, projection);
  }
  return Class.find(query);
};

module.exports = {
  getTeacherClassQuery,
  getTeacherClasses,
};
