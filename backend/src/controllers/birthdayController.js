const User = require("../models/User");
const Class = require("../models/Class");
const BirthdayWish = require("../models/BirthdayWish");
const {
  getSchoolLocalTodayStr,
  getSchoolNextMidnightDate,
  isBirthdayToday,
  calculateAge,
} = require("../utils/birthdayUtils");

// @desc    Get today's birthday cards
// @route   GET /api/birthdays/today
// @access  Private (Student, Teacher, Principal)
const getTodayBirthdays = async (req, res) => {
  try {
    const todayStr = getSchoolLocalTodayStr();
    
    // Find active users with a valid dateOfBirth
    const candidates = await User.find({
      status: "active",
      dateOfBirth: { $exists: true, $ne: null }
    }).select("-password");

    const birthdayUsers = [];

    for (const user of candidates) {
      if (isBirthdayToday(user.dateOfBirth, todayStr)) {
        const age = calculateAge(user.dateOfBirth, todayStr);
        let classInfo = null;
        let designation = null;

        if (user.role === "student") {
          const studentClass = await Class.findOne({ students: user._id });
          if (studentClass) {
            classInfo = {
              standard: studentClass.standard,
              section: studentClass.section,
              name: `${studentClass.standard}-${studentClass.section}`
            };
          }
        } else if (user.role === "teacher") {
          designation = user.designation || "Teacher";
        } else if (user.role === "principal") {
          designation = "Principal";
        }

        // Return ONLY non-sensitive, public birthday card fields
        birthdayUsers.push({
          _id: user._id,
          name: user.name,
          role: user.role,
          profilePic: user.profilePic || "",
          dateOfBirth: user.dateOfBirth,
          age,
          classInfo,
          designation
        });
      }
    }

    res.json({
      success: true,
      celebrationDate: todayStr,
      count: birthdayUsers.length,
      data: birthdayUsers
    });
  } catch (error) {
    console.error("Error in getTodayBirthdays:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wishes for today's birthdays
// @route   GET /api/birthdays/today/wishes
// @access  Private
const getTodayWishes = async (req, res) => {
  try {
    const todayStr = getSchoolLocalTodayStr();
    
    // Fetch only active, non-expired wishes for today
    const wishes = await BirthdayWish.find({
      celebrationDate: todayStr,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      celebrationDate: todayStr,
      data: wishes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a birthday wish for a birthday person
// @route   POST /api/birthdays/:targetUserId/wishes
// @access  Private (Principal, Teacher ONLY)
const createWish = async (req, res) => {
  try {
    // Permission Check: Students cannot post wishes
    if (req.user.role !== "principal" && req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only Principal and Teacher accounts can post birthday wishes."
      });
    }

    const { targetUserId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Wish message cannot be empty."
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Wish message cannot exceed 500 characters."
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Birthday user not found."
      });
    }

    const todayStr = getSchoolLocalTodayStr();
    
    // Verify target user actually has a birthday today
    if (!isBirthdayToday(targetUser.dateOfBirth, todayStr)) {
      return res.status(400).json({
        success: false,
        message: "Target user is not celebrating a birthday today."
      });
    }

    const expiresAt = getSchoolNextMidnightDate();

    const wish = await BirthdayWish.create({
      targetUserId: targetUser._id,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: message.trim(),
      celebrationDate: todayStr,
      expiresAt
    });

    // Notify via Socket.IO if available
    try {
      const getIO = require("../utils/socket").getIO;
      const io = getIO();
      if (io) {
        io.emit("birthday_wish_created", { wish });
      }
    } catch (e) {
      // Socket not initialized in tests/certain envs
    }

    res.status(201).json({
      success: true,
      message: "Birthday wish posted successfully.",
      data: wish
    });
  } catch (error) {
    console.error("Error in createWish:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a birthday wish
// @route   DELETE /api/birthdays/wishes/:wishId
// @access  Private (Sender or Principal)
const deleteWish = async (req, res) => {
  try {
    const { wishId } = req.params;
    const wish = await BirthdayWish.findById(wishId);

    if (!wish) {
      return res.status(404).json({ success: false, message: "Wish not found." });
    }

    // Only sender or principal can delete
    if (req.user.role !== "principal" && wish.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this wish."
      });
    }

    await BirthdayWish.findByIdAndDelete(wishId);

    res.json({
      success: true,
      message: "Birthday wish deleted successfully."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayBirthdays,
  getTodayWishes,
  createWish,
  deleteWish,
};
