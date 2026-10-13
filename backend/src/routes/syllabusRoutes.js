const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTeacherSyllabus,
  getSyllabusChapters,
  createChapter,
  updateChapter,
  updateChapterStatus,
  deleteChapter,
  getStudentSyllabusProgress,
  getParentSyllabusProgress,
  getSubjectSyllabus
} = require('../controllers/syllabusController');

// All routes require authentication
router.use(protect);

// Teacher routes
router.get('/my-assignments', getTeacherSyllabus);
router.get('/class/:classId/subject/:subjectId', getSyllabusChapters);
router.post('/chapters', createChapter);
router.put('/chapters/:chapterId', updateChapter);
router.patch('/chapters/:chapterId/completion', updateChapterStatus);
router.delete('/chapters/:chapterId', deleteChapter);

// Student route
router.get('/student/progress', getStudentSyllabusProgress);
router.get('/student/subject/:subjectId', getSubjectSyllabus);

// Parent route
router.get('/parent/children/:studentId/progress', getParentSyllabusProgress);

module.exports = router;
