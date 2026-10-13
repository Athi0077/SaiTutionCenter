const SchoolCalendar = require('../models/SchoolCalendar');
const Announcement = require('../models/Announcement');

// GET /api/calendar
// Get calendar events for a given month and year
exports.getCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = {};
    if (month && year) {
      // Calculate start and end of the month
      // month is 1-indexed from frontend usually (1-12)
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const events = await SchoolCalendar.find(query).sort({ date: 1 });
    
    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching calendar' });
  }
};

// GET /api/calendar/:id
exports.getCalendarEventById = async (req, res) => {
  try {
    const event = await SchoolCalendar.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Calendar event not found' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching calendar event' });
  }
};

// POST /api/calendar
exports.createCalendarEvent = async (req, res) => {
  try {
    const { date, title, type, description, announcementMessage, sendAnnouncement } = req.body;
    
    const parsedDate = new Date(date);
    // Ensure date is start of day in UTC to prevent timezone issues
    const dateObj = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
    
    // Check if event already exists on this date
    const existing = await SchoolCalendar.findOne({ date: dateObj });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A holiday already exists for this date.' });
    }
    
    const newEvent = new SchoolCalendar({
      date: dateObj,
      title,
      type,
      description,
      announcementMessage,
      isHoliday: true,
      createdBy: req.user.id
    });
    
    await newEvent.save();
    
    if (sendAnnouncement && announcementMessage) {
      const announcement = new Announcement({
        title: title,
        message: announcementMessage,
        role: req.user.role === 'main_principal' ? 'principal' : req.user.role,
        targetAudience: ['student', 'teacher', 'parent'],
        isImportant: true,
        createdBy: req.user.id
      });
      await announcement.save();
    }
    
    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating calendar event' });
  }
};

// PUT /api/calendar/:id
exports.updateCalendarEvent = async (req, res) => {
  try {
    const { date, title, type, description, announcementMessage } = req.body;
    
    const event = await SchoolCalendar.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Calendar event not found' });
    }
    
    if (date) {
      const parsedDate = new Date(date);
      const dateObj = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
      
      // check if another event exists on this new date
      const existing = await SchoolCalendar.findOne({ date: dateObj, _id: { $ne: event._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A holiday already exists for this new date.' });
      }
      event.date = dateObj;
    }
    
    if (title) event.title = title;
    if (type) event.type = type;
    if (description !== undefined) event.description = description;
    if (announcementMessage !== undefined) event.announcementMessage = announcementMessage;
    
    await event.save();
    
    res.json({ success: true, data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating calendar event' });
  }
};

// DELETE /api/calendar/:id
exports.deleteCalendarEvent = async (req, res) => {
  try {
    const event = await SchoolCalendar.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Calendar event not found' });
    }
    
    await SchoolCalendar.deleteOne({ _id: event._id });
    
    res.json({ success: true, message: 'Calendar event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error deleting calendar event' });
  }
};
