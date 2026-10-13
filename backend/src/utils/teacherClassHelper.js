const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
require("../models/Standard");

/**
 * Returns a MongoDB query that matches any classes belonging to a teacher:
 * either where teacherId === req.user._id, or where the teacher is assigned
 * to the class via TeacherAssignment (matching standardId or standard name).
 */
const getTeacherClassQuery = async (teacherId) => {
  const assignments = await TeacherAssignment.find({ teacherId })
    .populate("standardId");

  const classConditions = assignments.map((a) => {
    return [
      a.standardId?._id ? { standardId: a.standardId._id } : null,
      a.standardId?.name ? { standard: a.standardId.name } : null,
    ].filter(Boolean);
  }).flat();

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
