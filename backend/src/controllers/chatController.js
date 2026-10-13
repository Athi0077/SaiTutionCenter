const Message = require("../models/Message");

// @desc    Get chat history for a room
// @route   GET /api/chat/:roomId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params; 
    
    // Check authorization for class chats
    if (roomId.startsWith("class_")) {
      const classId = roomId.split("_")[1];
      const Class = require("../models/Class");
      const classDoc = await Class.findById(classId);
      if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

      if (req.user.role === "student") {
        if (!classDoc.students.includes(req.user._id)) {
          return res.status(403).json({ success: false, message: "Not in this class" });
        }
      } else if (req.user.role === "teacher") {
        if (classDoc.teacherId && classDoc.teacherId.toString() === req.user._id.toString()) {
          // class teacher, authorized
        } else {
          // Check if assigned subject teacher
          const TeacherAssignment = require("../models/TeacherAssignment");
          const Standard = require("../models/Standard");
          const Section = require("../models/Section");
          const standard = await Standard.findOne({ name: classDoc.standard });
          const section = await Section.findOne({ name: classDoc.section });
          
          if (!standard || !section) {
            return res.status(403).json({ success: false, message: "Not authorized for this class" });
          }
          
          const assignment = await TeacherAssignment.findOne({
            teacherId: req.user._id,
            standardId: standard._id,
            sectionId: section._id
          });
          
          if (!assignment) {
            return res.status(403).json({ success: false, message: "Not assigned to this class" });
          }
        }
      }
    }
    
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatHistory
};
