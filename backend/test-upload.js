require("dotenv").config();
const { cloudinary } = require("./src/middleware/uploadMiddleware");

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload("https://www.w3schools.com/w3images/avatar2.png", {
      folder: "school_management"
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testUpload();
