const Announcement = require('../models/Announcement');
const Class = require('../models/Class');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience, classId, isImportant } = req.body;

    if (req.user.role === 'teacher') {
      if (!classId) {
        return res.status(400).json({ success: false, message: 'Class is required for teacher announcements.' });
      }
      
      const cls = await Class.findById(classId);
      if (!cls || (cls.schoolId && cls.schoolId.toString() !== req.user.schoolId?.toString())) {
        return res.status(403).json({ success: false, message: 'Class not found or unauthorized.' });
      }
    }

    const announcement = await Announcement.create({
      title,
      message,
      createdBy: req.user._id,
      role: req.user.role,
      targetAudience,
      classId: req.user.role === 'teacher' ? classId : (classId || null),
      isImportant: isImportant || false
    });

    // -- FCM Bulk Push Notification Logic --
    try {
      const User = require('../models/User');
      const admin = require('../config/firebaseInit');

      let userQuery = { status: 'active', fcmTokens: { $exists: true, $not: { $size: 0 } } };
      
      if (targetAudience === 'student') {
        userQuery.role = 'student';
        if (announcement.classId) {
           const cls = await Class.findById(announcement.classId);
           if (cls) userQuery._id = { $in: cls.students };
        }
      } else if (targetAudience === 'teacher') {
        userQuery.role = 'teacher';
      } else if (targetAudience === 'parent') {
        userQuery.role = 'parent';
        if (announcement.classId) {
           const cls = await Class.findById(announcement.classId);
           if (cls) userQuery.children = { $in: cls.students };
        }
      } else {
         userQuery.role = { $in: ['student', 'teacher', 'parent'] };
      }

      const usersToNotify = await User.find(userQuery).select('fcmTokens');
      let allTokens = [];
      usersToNotify.forEach(u => {
        if (u.fcmTokens) {
          allTokens.push(...u.fcmTokens);
        }
      });

      if (allTokens.length > 0) {
        const payload = {
          notification: {
            title: `📣 ${title}`,
            body: message,
          },
          data: {
            type: 'announcement',
            url: '/'
          }
        };
        
        // FCM supports max 1000 tokens per request, so chunk it
        const chunkSize = 1000;
        for (let i = 0; i < allTokens.length; i += chunkSize) {
          const chunk = allTokens.slice(i, i + chunkSize);
          await admin.messaging().sendToDevice(chunk, payload);
        }
      }
    } catch (pushErr) {
      console.error("Announcement Push Error:", pushErr);
    }
    // -- End Push Notification Logic --

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadAnnouncements = async (req, res) => {
  try {
    let query = { readBy: { $ne: req.user._id } };

    if (req.user.role === 'student') {
      // Find class student belongs to
      const studentClass = await Class.findOne({ students: req.user._id });
      if (!studentClass) {
         query = { _id: null }; // No announcements if no class
      } else {
         query.targetAudience = 'student';
         query.$or = [
           { role: 'principal' },
           { role: 'teacher', classId: studentClass._id }
         ];
      }
    } else if (req.user.role === 'teacher') {
      query.targetAudience = 'teacher';
      query.role = 'principal';
    } else if (req.user.role === 'parent') {
      query.targetAudience = 'parent';
      // To keep it simple, fetch principal announcements for parents, or class announcements if we check their children's classes
      // Assuming parent logic can just fetch principal for now unless specified
      query.role = 'principal';
    } else if (req.user.role === 'principal') {
      // Principal doesn't get announcements in this spec
      query = { _id: null };
    }

    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.user._id }
    });
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user._id })
      .populate('classId', 'className standard section')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found or unauthorized' });
    }
    await announcement.deleteOne();
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
