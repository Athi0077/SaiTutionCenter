const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Class = require('./src/models/Class');
const Section = require('./src/models/Section');
const Standard = require('./src/models/Standard');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const sections = await Section.find().populate('standardId');
  for (const section of sections) {
    if (!section.standardId) continue;
    const className = section.standardId.name + ' - ' + section.name;
    const exists = await Class.findOne({ className });
    if (!exists) {
      console.log('Creating missing class:', className);
      await Class.create({
        standard: section.standardId.name,
        section: section.name,
        className,
        status: 'active',
        subjects: []
      });
    }
  }
  console.log('Done');
  process.exit(0);
});
