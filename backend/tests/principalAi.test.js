const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server"); // Assuming this exports the app
const User = require("../../src/models/User");
const Class = require("../../src/models/Class");
const ExamMark = require("../../src/models/ExamMark");
const Attendance = require("../../src/models/Attendance");
const openRouterService = require("../../src/services/openRouterService");

jest.mock("../../src/services/openRouterService");

let principalToken, teacherToken, studentToken;
let student1Id;

describe("Principal AI Dashboard API Endpoints", () => {
  beforeAll(async () => {
    // Connect to test database if not already handled by a global setup
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management_test_ai";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    // Create users for test
    const principal = await User.create({
      name: "Principal Test",
      email: "principal_ai@test.com",
      password: "password123",
      role: "principal"
    });
    const teacher = await User.create({
      name: "Teacher Test",
      email: "teacher_ai@test.com",
      password: "password123",
      role: "teacher"
    });
    const student = await User.create({
      name: "Student Test",
      email: "student_ai@test.com",
      password: "password123",
      role: "student",
      studentId: "STU-AI-001"
    });
    student1Id = student._id;

    // Get tokens (bypassing actual login by generating token, but simulating login is better)
    const loginPrincipal = await request(app).post("/api/auth/login").send({ email: "principal_ai@test.com", password: "password123" });
    principalToken = loginPrincipal.body.token;

    const loginTeacher = await request(app).post("/api/auth/login").send({ email: "teacher_ai@test.com", password: "password123" });
    teacherToken = loginTeacher.body.token;

    const loginStudent = await request(app).post("/api/auth/login").send({ email: "student_ai@test.com", password: "password123" });
    studentToken = loginStudent.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ["principal_ai@test.com", "teacher_ai@test.com", "student_ai@test.com"] } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Access Control", () => {
    it("should allow principal to access AI overview", async () => {
      const res = await request(app)
        .get("/api/principal/ai/overview")
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/principal/ai/overview");
      expect(res.status).toBe(401);
    });

    it("should reject teacher access", async () => {
      const res = await request(app)
        .get("/api/principal/ai/overview")
        .set("Authorization", `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    it("should reject student access", async () => {
      const res = await request(app)
        .get("/api/principal/ai/overview")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Student Data endpoints", () => {
    it("should return valid student details for existing student", async () => {
      const res = await request(app)
        .get(`/api/principal/ai/student/${student1Id}`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.profile.name).toBe("Student Test");
    });

    it("should return 404 for invalid student ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/principal/ai/student/${fakeId}`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("AI Analysis", () => {
    it("should correctly handle OpenRouter success response", async () => {
      openRouterService.analyzeStudent.mockResolvedValueOnce("MOCKED AI ANALYSIS RESULT");
      
      const res = await request(app)
        .post(`/api/principal/ai/student/${student1Id}/analyze`)
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBe("MOCKED AI ANALYSIS RESULT");
      expect(openRouterService.analyzeStudent).toHaveBeenCalled();
    });

    it("should handle OpenRouter failure without crashing", async () => {
      openRouterService.analyzeStudent.mockRejectedValueOnce(new Error("OpenRouter API error: 500"));
      
      const res = await request(app)
        .post(`/api/principal/ai/student/${student1Id}/analyze`)
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
