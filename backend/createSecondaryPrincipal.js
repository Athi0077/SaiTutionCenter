const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/homework-app')
  .then(async () => {
    console.log('Connected to DB');
    
    // Check if secondary principal already exists
    let secondary = await User.findOne({ email: 'secondary@gmail.com' });
    
    if (secondary) {
      console.log('Secondary Principal already exists.');
    } else { 
      secondary = new User({
        name: 'Secondary Principal',
        email: 'secondary@gmail.com',
        password: 'password123',
        role: 'principal',
        status: 'active',
        // Optional: Assuming they belong to the same school if schoolId is used
      });
      
      const mainPrincipal = await User.findOne({ role: 'principal', email: 'hero@gamil.com' });
      if (mainPrincipal && mainPrincipal.schoolId) {
          secondary.schoolId = mainPrincipal.schoolId;
      }

      await secondary.save();
      console.log('Secondary Principal created successfully!');
      console.log('Email: secondary@gmail.com');
      console.log('Password: password123');
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
