const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/schoolCalendarController');

router.use(protect);

router.route('/')
  .get(getCalendarEvents)
  .post(requireRole('principal'), createCalendarEvent);

router.route('/:id')
  .get(getCalendarEventById)
  .put(requireRole('principal'), updateCalendarEvent)
  .delete(requireRole('principal'), deleteCalendarEvent);

module.exports = router;
