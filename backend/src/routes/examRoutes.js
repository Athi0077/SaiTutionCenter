const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  publishExam,
  cancelExam,
  deleteExam,
  getTeacherExams,
  getStudentExams,
  getParentChildExams,
  enterMarks,
  getExamMarks,
  getStudentReportCard,
  getParentChildReportCard
} = require('../controllers/examController');

router.use(protect);

// Principal Routes
router.post('/', createExam);
router.get('/', getExams);
router.get('/principal/:examId', getExamById); // specific route to avoid conflict
router.put('/:examId', updateExam);
router.patch('/:examId/publish', publishExam);
router.patch('/:examId/cancel', cancelExam);
router.delete('/:examId', deleteExam);

// Teacher Routes
router.get('/teacher', getTeacherExams);
router.post('/:examId/marks', enterMarks); // Teacher entering marks
router.get('/:examId/marks', getExamMarks); // Get marks for a specific exam subject

// Student Routes
router.get('/student', getStudentExams);
router.get('/student/report-card', getStudentReportCard);

// Parent Routes
router.get('/parent/children/:studentId', getParentChildExams);
router.get('/parent/children/:studentId/report-card', getParentChildReportCard);

module.exports = router;
