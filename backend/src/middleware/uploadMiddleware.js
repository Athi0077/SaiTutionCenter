const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PROFILE_IMAGE_MAX_SIZE = 1 * 1024 * 1024; // 1 MB
const HOMEWORK_MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const TEACHER_FILE_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const createStorage = (folder, allowed_formats) => new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: folder,
    allowed_formats: allowed_formats,
    resource_type: "auto"
  },
});

// Helper to wrap multer and provide custom error messages
const createWrappedUpload = (multerInstance, fieldName, customSizeErrorMessage) => {
  const uploadMiddleware = multerInstance.single(fieldName);
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: customSizeErrorMessage });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
};

// 1. Profile Picture (1 MB)
const uploadProfilePicMulter = multer({
  storage: createStorage("school_management/profiles", ["jpg", "jpeg", "png", "webp"]),
  limits: { fileSize: PROFILE_IMAGE_MAX_SIZE }
});
const uploadProfilePic = createWrappedUpload(uploadProfilePicMulter, "profilePic", "Profile picture must be 1 MB or less.");

// 2. Student Homework Submission (3 MB)
const uploadHomeworkMulter = multer({
  storage: createStorage("school_management/homework", ["jpg", "jpeg", "png", "pdf", "webp"]),
  limits: { fileSize: HOMEWORK_MAX_SIZE }
});
const uploadHomework = createWrappedUpload(uploadHomeworkMulter, "file", "Homework file must be 3 MB or less.");

// 3. Teacher File Upload (10 MB)
const uploadTeacherFileMulter = multer({
  storage: createStorage("school_management/teacher_files", ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"]),
  limits: { fileSize: TEACHER_FILE_MAX_SIZE }
});
const uploadTeacherFile = createWrappedUpload(uploadTeacherFileMulter, "file", "File size must be 10 MB or less.");

// For backward compatibility while refactoring
// Wrap generic upload for any remaining routes using generic `upload.single("file")`
// We'll give it the Homework limit by default or a general limit.
const upload = {
  single: (fieldName) => createWrappedUpload(uploadHomeworkMulter, fieldName, "Homework file must be 3 MB or less.")
};

module.exports = { 
  upload, 
  uploadProfilePic, 
  uploadHomework, 
  uploadTeacherFile,
  cloudinary 
};
