const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../src/models/User");
const AiIntervention = require("../../src/models/AiIntervention");
const ExamMark = require("../../src/models/ExamMark");
const openRouterService = require("../../src/services/openRouterService");

jest.mock("../../src/services/openRouterService");

let principalToken, teacherToken;
let studentId;
let interventionId;

describe("Principal AI Progress & Interventions Endpoints", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management_test_ai_progress";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    const principal = await User.create({ name: "Principal AI Progress", email: "principal_ai_prog@test.com", password: "password123", role: "principal" });
    const teacher = await User.create({ name: "Teacher AI Progress", email: "teacher_ai_prog@test.com", password: "password123", role: "teacher" });
    const student = await User.create({ name: "Student AI Progress", email: "student_ai_prog@test.com", password: "password123", role: "student", studentId: "STU-PROG-01" });
    studentId = student._id;

    await ExamMark.create({
      examId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      studentId: studentId,
      teacherId: teacher._id,
      marksObtained: 60,
      maxMarks: 100
    });

    const loginPrincipal = await request(app).post("/api/auth/login").send({ email: "principal_ai_prog@test.com", password: "password123" });
    principalToken = loginPrincipal.body.token;

    const loginTeacher = await request(app).post("/api/auth/login").send({ email: "teacher_ai_prog@test.com", password: "password123" });
    teacherToken = loginTeacher.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await ExamMark.deleteMany({});
    await AiIntervention.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Intervention Management", () => {
    it("should reject non-principal access", async () => {
      const res = await request(app)
        .get("/api/principal/ai-progress/dashboard")
        .set("Authorization", `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    it("should create a new intervention plan", async () => {
      const res = await request(app)
        .post("/api/principal/ai-progress/interventions")
        .set("Authorization", `Bearer ${principalToken}`)
        .send({
          studentId,
          concern: "Low Math Scores",
          improvementTarget: "Get above 75%",
          subjects: ["Math"],
          actionItems: ["Extra classes"],
          reviewDate: new Date()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.baselineMetrics.overallAverage).toBe(60);
      interventionId = res.body.data._id;
    });

    it("should fetch dashboard stats", async () => {
      const res = await request(app)
        .get("/api/principal/ai-progress/dashboard")
        .set("Authorization", `Bearer ${principalToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.stats.total).toBe(1);
    });

    it("should update intervention status", async () => {
      const res = await request(app)
        .patch(`/api/principal/ai-progress/interventions/${interventionId}`)
        .set("Authorization", `Bearer ${principalToken}`)
        .send({ status: "In Progress" });
        
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("In Progress");
    });

    it("should generate AI progress review", async () => {
      openRouterService.generateChatAnswer.mockResolvedValueOnce("Mocked Progress Review");

      const res = await request(app)
        .post(`/api/principal/ai-progress/interventions/${interventionId}/review`)
        .set("Authorization", `Bearer ${principalToken}`)
        .send({ principalNotes: "Good effort" });
        
      expect(res.status).toBe(200);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.reviews[0].aiSummary).toBe("Mocked Progress Review");
      expect(res.body.data.reviews[0].principalNotes).toBe("Good effort");
    });
  });
});
