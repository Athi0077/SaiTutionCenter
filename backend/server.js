require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
if (process.env.NODE_ENV !== 'test') {
  const dns = require("node:dns");
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

// Routes 
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const app = express();
// Socket is initialized conditionally later
let server, initSocket;
if (process.env.NODE_ENV !== 'test') {
  const http = require("http");
  initSocket = require("./src/utils/socket").initSocket;
  server = http.createServer(app);
  initSocket(server);
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://sai-tution-center.vercel.app'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dns = require("node:dns")
dns.setServers(['8.8.8.8', '8.8.4.4'])

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", require("./src/routes/classRoutes"));
app.use("/api/class-requests", require("./src/routes/classRequestRoutes"));
app.use("/api/subjects", require("./src/routes/subjectRoutes"));
app.use("/api/homework", require("./src/routes/homeworkRoutes"));
app.use("/api/submissions", require("./src/routes/submissionRoutes"));
app.use("/api/attendance", require("./src/routes/attendanceRoutes"));
app.use("/api/leave-requests", require("./src/routes/leaveRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/standards", require("./src/routes/standardRoutes"));
app.use("/api/teacher-assignments", require("./src/routes/teacherAssignmentRoutes"));
app.use("/api/principal/teachers", require("./src/routes/principalTeacherRoutes"));
app.use("/api/principal/students", require("./src/routes/principalStudentRoutes"));
app.use("/api/principal/student-details", require("./src/routes/principalStudentRoutes"));
app.use("/api/teacher/students", require("./src/routes/principalStudentRoutes"));
app.use("/api/teacher/student-details", require("./src/routes/principalStudentRoutes"));
app.use("/api/projects", require("./src/routes/projectRoutes"));
app.use("/api/tests", require("./src/routes/testRoutes"));
app.use("/api/academic-years", require("./src/routes/academicYearRoutes"));
app.use("/api/promotions", require("./src/routes/promotionRoutes"));
app.use("/api/admissions", require("./src/routes/admissionRoutes"));
app.use("/api/general-register", require("./src/routes/generalRegisterRoutes"));
app.use("/api/parents", require("./src/routes/parentRoutes"));
app.use("/api/syllabus", require("./src/routes/syllabusRoutes"));
app.use("/api/exams", require("./src/routes/examRoutes"));
app.use("/api/chat", require("./src/routes/chatRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/quotes", require("./src/routes/quoteRoutes"));
app.use("/api/announcements", require("./src/routes/announcementRoutes"));
app.use("/api/resources", require("./src/routes/resourceRoutes"));
app.use("/api/timetable", require("./src/routes/timetableRoutes"));
app.use("/api/todos", require("./src/routes/todoRoutes"));
app.use("/api/temporary-principal-access", require("./src/routes/temporaryAccessRoutes"));
app.use("/api/id-card", require("./src/routes/idCardRoutes"));
app.use("/api/fee-status", require("./src/routes/feeStatusRoutes"));
app.use("/api/events", require("./src/routes/eventRoutes"));
app.use("/api/special-classes", require("./src/routes/specialClassRoutes"));
app.use("/api/birthdays", require("./src/routes/birthdayRoutes"));
app.use("/api/calendar", require("./src/routes/schoolCalendarRoutes"));
app.use("/api/fun-activities", require("./src/routes/quizRoutes"));
app.use("/api/super-admin", require("./src/routes/superAdminRoutes"));
app.use("/api/principal/ai", require("./src/routes/principalAiRoutes"));

app.use("/api/hand-raises", require("./src/routes/handRaiseRoutes"));
app.use("/api/substitutes", require("./src/routes/substituteRoutes"));
app.use("/api/staff-leave", require("./src/routes/staffLeaveRoutes"));

app.use("/api/tuition-sessions", require("./src/routes/tuitionSessionRoutes"));
app.use("/api/tuition-attendance", require("./src/routes/tuitionAttendanceRoutes"));
app.use("/api/tuition-homework", require("./src/routes/tuitionHomeworkRoutes"));
app.use("/api/tuition-tests", require("./src/routes/tuitionTestRoutes"));
app.use("/api/tuition-fees", require("./src/routes/tuitionFeeRoutes"));
app.use("/api/batches", require("./src/routes/batchRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", dashboardRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "School Management API Step 1" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB
  connectDB().then(async () => {
    // Sync indexes to drop old conflicting indexes (like attendance without session)
    try {
      const Attendance = require("./src/models/Attendance");
      const AttendanceSession = require("./src/models/AttendanceSession");
      await Attendance.syncIndexes();
      await AttendanceSession.syncIndexes();
      console.log("Indexes synced for Attendance and AttendanceSession");
      
      // Drop the email index on User collection that causes duplicate key error on null values
      const User = require("./src/models/User");
      try {
        await User.collection.dropIndex("email_1");
        console.log("Dropped faulty email_1 index from users collection");
      } catch (e) {
        // Ignored if it doesn't exist
      }
      await User.syncIndexes();
    } catch (err) {
      console.error("Index sync error:", err);
    }

    // Seed principal after DB connection
    const { seedPrincipal, seedSuperAdmin } = require("./src/utils/seed");
    seedPrincipal();
    seedSuperAdmin();

    // Initialize Birthday Scheduler
    const { initBirthdayScheduler } = require("./src/services/birthdayScheduler");
    initBirthdayScheduler();

    // Initialize Fee Cycle Scheduler (Monthly 1st & Yearly auto-reset to PENDING)
    const { initFeeCycleScheduler } = require("./src/services/feeCycleScheduler");
    initFeeCycleScheduler();
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
