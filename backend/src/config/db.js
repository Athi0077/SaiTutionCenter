const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    // Help Windows DNS resolver resolve MongoDB Atlas SRV records smoothly if needed
    if (process.env.MONGO_URI && process.env.MONGO_URI.includes("mongodb+srv")) {
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
      } catch (e) {
        // Fallback silently if setServers fails
      }
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 200, // Handle 500 VUs concurrently without queuing
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
