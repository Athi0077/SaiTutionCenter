const express = require("express");
const router = express.Router();
const {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getActiveTeachers,
  updateProfile,
  getStudents
} = require("../controllers/userController");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { uploadProfilePic } = require("../middleware/uploadMiddleware");

router.get("/pending-teachers", protect, requireRole("principal"), getPendingTeachers);
router.get("/active-teachers", protect, requireRole("principal"), getActiveTeachers);
router.get("/students", protect, getStudents);
const { resetStudentPassword } = require("../controllers/userController");
router.post("/students/:id/reset-password", protect, requireRole("teacher"), resetStudentPassword);
router.patch("/:id/approve", protect, requireRole("principal"), approveTeacher);
router.patch("/:id/reject", protect, requireRole("principal"), rejectTeacher);

router.put("/profile", protect, updateProfile);

const { uploadProfilePic: uploadProfilePicController, deleteProfilePic, saveFCMToken, testNotification } = require("../controllers/userController");
router.post("/profile/upload", protect, uploadProfilePic, uploadProfilePicController);
router.delete("/profile/upload", protect, deleteProfilePic);
router.post("/fcm-token", protect, saveFCMToken);
router.post("/test-notification", protect, testNotification);

module.exports = router;
