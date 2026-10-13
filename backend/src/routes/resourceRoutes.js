const express = require('express');
const router = express.Router();
const { getStudentResources } = require('../controllers/resourceController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/student', protect, requireRole('student'), getStudentResources);

module.exports = router;
