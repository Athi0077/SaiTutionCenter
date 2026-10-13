const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../src/models/User");
const Class = require("../../src/models/Class");
const ExamMark = require("../../src/models/ExamMark");
const openRouterService = require("../../src/services/openRouterService");

jest.mock("../../src/services/openRouterService");

let principalToken, teacherToken, studentToken;
let testClassId, studentId1, studentId2;

describe("Principal AI Class Analytics Endpoints", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management_test_ai_class";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    // Create Users
    const principal = await User.create({ name: "Principal AI", email: "principal_ai_class@test.com", password: "password123", role: "principal" });
    const teacher = await User.create({ name: "Teacher AI", email: "teacher_ai_class@test.com", password: "password123", role: "teacher" });
    const student1 = await User.create({ name: "Student 1", email: "student_1@test.com", password: "password123", role: "student" });
    const student2 = await User.create({ name: "Student 2", email: "student_2@test.com", password: "password123", role: "student" });
    studentId1 = student1._id;
    studentId2 = student2._id;

    // Create Class
    const testClass = await Class.create({
      className: "10",
      standard: "10th",
      section: "A",
      students: [studentId1, studentId2]
    });
    testClassId = testClass._id;

    // Add Exam Marks
    await ExamMark.create({
      examId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      studentId: studentId1,
      teacherId: teacher._id,
      marksObtained: 35 // This should trigger early warning
    });

    await ExamMark.create({
      examId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      studentId: studentId2,
      teacherId: teacher._id,
      marksObtained: 85
    });

    // Login for tokens
    const loginPrincipal = await request(app).post("/api/auth/login").send({ email: "principal_ai_class@test.com", password: "password123" });
    principalToken = loginPrincipal.body.token;

    const loginTeacher = await request(app).post("/api/auth/login").send({ email: "teacher_ai_class@test.com", password: "password123" });
    teacherToken = loginTeacher.body.token;

    const loginStudent = await request(app).post("/api/auth/login").send({ email: "student_1@test.com", password: "password123" });
    studentToken = loginStudent.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await Class.deleteMany({});
    await ExamMark.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Access Control", () => {
    it("should allow principal to access class analytics overview", async () => {
      const res = await request(app)
        .get(`/api/principal/ai/class-analytics/${testClassId}`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject teacher access", async () => {
      const res = await request(app)
        .get(`/api/principal/ai/class-analytics/${testClassId}`)
        .set("Authorization", `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Analytics & Warnings", () => {
    it("should calculate class average correctly", async () => {
      const res = await request(app)
        .get(`/api/principal/ai/class-analytics/${testClassId}`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalEnrolled).toBe(2);
      expect(res.body.data.classAveragePercentage).toBe(60); // (35 + 85) / 2
    });

    it("should flag early warnings correctly based on thresholds", async () => {
      // Default mark threshold is 40. Student 1 has 35.
      const res = await request(app)
        .get(`/api/principal/ai/class-analytics/${testClassId}/early-warnings`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      
      const student1Warning = res.body.data.find(w => w.student.id.toString() === studentId1.toString());
      expect(student1Warning).toBeDefined();
      expect(student1Warning.flags.some(f => f.type === "Academic")).toBe(true);
      
      const student2Warning = res.body.data.find(w => w.student.id.toString() === studentId2.toString());
      // Should not have academic warning since marks are 85, unless attendance/homework fails (which are 0% -> will flag)
      if (student2Warning) {
        expect(student2Warning.flags.some(f => f.type === "Academic")).toBe(false);
      }
    });
  });

  describe("AI Summarization", () => {
    it("should call openRouterService.analyzeClass with class payload", async () => {
      openRouterService.analyzeClass.mockResolvedValueOnce("MOCKED CLASS AI SUMMARY");
      
      const res = await request(app)
        .post(`/api/principal/ai/class-analytics/${testClassId}/summary`)
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBe("MOCKED CLASS AI SUMMARY");
      expect(openRouterService.analyzeClass).toHaveBeenCalled();
    });
  });
});
