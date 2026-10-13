const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../src/models/User");
const AiReport = require("../../src/models/AiReport");
const ExamMark = require("../../src/models/ExamMark");
const openRouterService = require("../../src/services/openRouterService");

jest.mock("../../src/services/openRouterService");

let principalToken, teacherToken;
let studentId;

describe("Principal AI Reports Endpoints", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management_test_ai_reports";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    const principal = await User.create({ name: "Principal AI Report", email: "principal_ai_rep@test.com", password: "password123", role: "principal" });
    const teacher = await User.create({ name: "Teacher AI Report", email: "teacher_ai_rep@test.com", password: "password123", role: "teacher" });
    const student = await User.create({ name: "Student AI Report", email: "student_ai_rep@test.com", password: "password123", role: "student", studentId: "STU-REP-01" });
    studentId = student._id;

    await ExamMark.create({
      examId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      studentId: studentId,
      teacherId: teacher._id,
      marksObtained: 85,
      maxMarks: 100
    });

    const loginPrincipal = await request(app).post("/api/auth/login").send({ email: "principal_ai_rep@test.com", password: "password123" });
    principalToken = loginPrincipal.body.token;

    const loginTeacher = await request(app).post("/api/auth/login").send({ email: "teacher_ai_rep@test.com", password: "password123" });
    teacherToken = loginTeacher.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await ExamMark.deleteMany({});
    await AiReport.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Report Generation & Approval", () => {
    it("should fetch raw report data successfully", async () => {
      const res = await request(app)
        .get(`/api/principal/ai-reports/student/${studentId}/data`)
        .set("Authorization", `Bearer ${principalToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.academic.overallPercentage).toBe(85);
    });

    it("should generate AI Summary", async () => {
      openRouterService.generateChatAnswer.mockResolvedValueOnce("Mocked AI Report Summary");

      const res = await request(app)
        .post(`/api/principal/ai-reports/student/${studentId}/generate`)
        .set("Authorization", `Bearer ${principalToken}`)
        .send({ reportData: { profile: {}, academic: {}, attendance: {} } });
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBe("Mocked AI Report Summary");
    });

    it("should reject teachers from generating reports", async () => {
      const res = await request(app)
        .post(`/api/principal/ai-reports/student/${studentId}/generate`)
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({ reportData: {} });
        
      expect(res.status).toBe(403);
    });

    it("should save approved report", async () => {
      const res = await request(app)
        .post("/api/principal/ai-reports/approve")
        .set("Authorization", `Bearer ${principalToken}`)
        .send({
          studentId: studentId,
          reportType: "Individual Academic",
          academicPeriod: "Current Term",
          verifiedMetrics: { test: 1 },
          aiInsights: "Some approved insights"
        });
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approved).toBe(true);
      
      const check = await request(app)
        .get(`/api/principal/ai-reports/${res.body.data._id}`)
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(check.status).toBe(200);
      expect(check.body.data.aiInsights).toBe("Some approved insights");
    });
  });
});
