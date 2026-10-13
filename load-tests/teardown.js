require("dotenv").config({ path: __dirname + "/.env.loadtest" });
const User = require("../backend/src/models/User");
const mongoose = User.base;

const TEST_DB_URI = process.env.MONGO_URI;

async function teardown() {
  try {
    console.log(`Connecting to ${TEST_DB_URI}`);
    await mongoose.connect(TEST_DB_URI);
    console.log("Connected to Test DB.");

    console.log("Dropping database...");
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");

    process.exit(0);
  } catch (err) {
    console.error("Teardown failed:", err);
    process.exit(1);
  }
}

teardown();
