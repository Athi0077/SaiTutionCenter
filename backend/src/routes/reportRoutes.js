const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.post('/', protect, reportController.createReport);
router.get('/', protect, reportController.getReports);
router.get('/:id', protect, reportController.getReportDetails);
router.put('/:id', protect, reportController.updateReport);
router.post('/:id/messages', protect, reportController.addMessage);

module.exports = router;
