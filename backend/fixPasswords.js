const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./src/models/User");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("Connected to MongoDB");
  const result = await User.updateMany({ mustChangePassword: true }, { $set: { mustChangePassword: false } });
  console.log(`Updated ${result.modifiedCount} users to not require password change.`);
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
