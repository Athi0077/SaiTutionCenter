const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createAnnouncement, 
  getUnreadAnnouncements, 
  markAsRead, 
  getMyAnnouncements, 
  deleteAnnouncement 
} = require('../controllers/announcementController');

router.use(protect);

router.post('/', createAnnouncement);
router.get('/unread', getUnreadAnnouncements);
router.get('/my', getMyAnnouncements);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteAnnouncement);

module.exports = router;
