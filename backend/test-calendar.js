require('dotenv').config();
const mongoose = require('mongoose');
const SchoolCalendar = require('./src/models/SchoolCalendar');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    try {
      const startDate = new Date(2026, 9, 1);
      const endDate = new Date(2026, 10, 0, 23, 59, 59, 999);
      const events = await SchoolCalendar.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      console.log('Events:', events);
    } catch (err) {
      console.error('Error finding events:', err);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('DB connect error', err);
    process.exit(1);
  });
