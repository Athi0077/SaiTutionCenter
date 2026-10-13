const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../src/models/User");
const AiConversation = require("../../src/models/AiConversation");
const openRouterService = require("../../src/services/openRouterService");

jest.mock("../../src/services/openRouterService");

let principalToken, teacherToken;
let principalId;

describe("Principal AI Chat Assistant Endpoints", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_management_test_ai_chat";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    const principal = await User.create({ name: "Principal AI Chat", email: "principal_ai_chat@test.com", password: "password123", role: "principal" });
    const teacher = await User.create({ name: "Teacher AI Chat", email: "teacher_ai_chat@test.com", password: "password123", role: "teacher" });
    principalId = principal._id;

    const loginPrincipal = await request(app).post("/api/auth/login").send({ email: "principal_ai_chat@test.com", password: "password123" });
    principalToken = loginPrincipal.body.token;

    const loginTeacher = await request(app).post("/api/auth/login").send({ email: "teacher_ai_chat@test.com", password: "password123" });
    teacherToken = loginTeacher.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await AiConversation.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Conversation Management", () => {
    let convoId;

    it("should create a new conversation", async () => {
      const res = await request(app)
        .post("/api/principal/ai-assistant/conversations")
        .set("Authorization", `Bearer ${principalToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Conversation");
      convoId = res.body.data._id;
    });

    it("should list conversations", async () => {
      const res = await request(app)
        .get("/api/principal/ai-assistant/conversations")
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should prevent teachers from accessing conversations", async () => {
      const res = await request(app)
        .get("/api/principal/ai-assistant/conversations")
        .set("Authorization", `Bearer ${teacherToken}`);
        
      expect(res.status).toBe(403);
    });

    it("should delete a conversation", async () => {
      const res = await request(app)
        .delete(`/api/principal/ai-assistant/conversations/${convoId}`)
        .set("Authorization", `Bearer ${principalToken}`);
        
      expect(res.status).toBe(200);
      
      const check = await request(app)
        .get(`/api/principal/ai-assistant/conversations/${convoId}`)
        .set("Authorization", `Bearer ${principalToken}`);
      expect(check.status).toBe(404);
    });
  });

  describe("Chat Interaction", () => {
    it("should handle valid query intent", async () => {
      openRouterService.extractIntent.mockResolvedValueOnce({
        intent: "SCHOOL_ENROLLMENT_SUMMARY",
        parameters: {}
      });
      openRouterService.generateChatAnswer.mockResolvedValueOnce("We have 500 students enrolled.");

      const res = await request(app)
        .post("/api/principal/ai-assistant/chat")
        .set("Authorization", `Bearer ${principalToken}`)
        .send({ message: "How many students are enrolled?" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("We have 500 students enrolled.");
      expect(openRouterService.extractIntent).toHaveBeenCalled();
      expect(openRouterService.generateChatAnswer).toHaveBeenCalled();
      
      const convo = await AiConversation.findById(res.body.data.conversationId);
      expect(convo.messages.length).toBe(2);
      expect(convo.messages[1].role).toBe("assistant");
      expect(convo.messages[1].content).toBe("We have 500 students enrolled.");
    });

    it("should reject UNKNOWN intent gracefully without database call", async () => {
      openRouterService.extractIntent.mockResolvedValueOnce({
        intent: "UNKNOWN"
      });

      const res = await request(app)
        .post("/api/principal/ai-assistant/chat")
        .set("Authorization", `Bearer ${principalToken}`)
        .send({ message: "Write a poem about school." });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("I'm not sure how to answer that");
    });
  });
});
