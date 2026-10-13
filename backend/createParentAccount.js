require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } 
};

const seedParent = async () => {
  await connectDB();

  try {
    // Check if parent already exists
    const existingParent = await User.findOne({ email: "parent@school.com" });
    if (existingParent) {
      console.log("Parent account already exists: parent@school.com (Password: Parent@123)");
      process.exit();
    }

    // Find a student to link to
    const student = await User.findOne({ role: "student" });
    let childrenIds = [];
    if (student) {
      childrenIds.push(student._id);
      console.log(`Linking parent to student: ${student.name}`);
    } else {
      console.log("No student found in DB. Parent created with no linked children.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Parent@123", salt);

    // Create the parent directly (bypassing pre-save hook to ensure exact password hash if needed, but since User model has pre-save hash, we should NOT double hash it!)
    // Wait, let's just use create() and let the pre-save hook handle hashing!
    
    const parent = await User.create({
      name: "John Parent",
      email: "parent@school.com",
      password: "Parent@123",
      role: "parent",
      status: "active",
      children: childrenIds,
      contactDetails: {
        parentPhone: "9876543210"
      }
    });

    console.log(`SUCCESS! Parent Account Created.`);
    console.log(`Email: parent@school.com`);
    console.log(`Password: Parent@123`);
    console.log(`Role: parent`);
    
    process.exit();
  } catch (error) {
    console.error("Error creating parent:", error);
    process.exit(1);
  }
};

seedParent();
