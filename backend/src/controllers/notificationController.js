const Notification = require("../models/Notification");
const Announcement = require("../models/Announcement");
const Class = require("../models/Class");

// Helper to get announcement query for a user
const getAnnouncementQuery = async (user) => {
  if (user.role === 'student') {
    const studentClass = await Class.findOne({ students: user._id });
    if (!studentClass) return { _id: null };
    return {
      targetAudience: 'student',
      $or: [{ role: 'principal' }, { role: 'teacher', classId: studentClass._id }]
    };
  } else if (user.role === 'teacher') {
    return { targetAudience: 'teacher', role: 'principal' };
  } else if (user.role === 'parent') {
    return { targetAudience: 'parent', role: 'principal' };
  }
  return { _id: null };
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id }).lean();
    
    // Fetch announcements for this user
    const annQuery = await getAnnouncementQuery(req.user);
    const announcements = await Announcement.find(annQuery).lean();
    
    // Map announcements to notification format
    const mappedAnnouncements = announcements.map(ann => ({
      _id: ann._id,
      type: 'announcement',
      title: ann.title,
      message: ann.message,
      createdAt: ann.createdAt,
      isRead: ann.readBy.some(id => id.toString() === req.user._id.toString()),
      isImportant: ann.isImportant
    }));

    // Combine and sort
    const combined = [...notifications, ...mappedAnnouncements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const notifCount = await Notification.countDocuments({ recipientId: req.user._id, isRead: false });
    
    const annQuery = await getAnnouncementQuery(req.user);
    annQuery.readBy = { $ne: req.user._id };
    const annCount = await Announcement.countDocuments(annQuery);

    res.json({ success: true, count: notifCount + annCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    // First try notification
    let item = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    // If not found, try announcement
    if (!item) {
      item = await Announcement.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { readBy: req.user._id } },
        { new: true }
      );
    }
    
    if (!item) {
      return res.status(404).json({ success: false, message: "Notification or Announcement not found" });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    // Mark all announcements as read
    const annQuery = await getAnnouncementQuery(req.user);
    annQuery.readBy = { $ne: req.user._id };
    const unreadAnns = await Announcement.find(annQuery);
    for (const ann of unreadAnns) {
      ann.readBy.push(req.user._id);
      await ann.save();
    }
    
    res.json({ success: true, message: "All notifications and announcements marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
