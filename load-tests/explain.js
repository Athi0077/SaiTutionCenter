const Attendance = require("../backend/src/models/Attendance");
const ClassJoinRequest = require("../backend/src/models/ClassJoinRequest");
const LeaveRequest = require("../backend/src/models/LeaveRequest");

const mongoose = Attendance.base;

async function runExplain() {
  try {
    await mongoose.connect("mongodb://localhost:27017/studymate_test");
    console.log("Connected to test DB");

    // 1. Attendance Teacher Dashboard Query
    const mockClassIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    console.log("--- Attendance.find({ classId: { $in: [...] }, date: today }) ---");
    const attExplain = await Attendance.find({ classId: { $in: mockClassIds }, date: today }).explain("executionStats");
    console.log("Index used:", attExplain.queryPlanner.winningPlan.inputStage ? attExplain.queryPlanner.winningPlan.inputStage.indexName : (attExplain.queryPlanner.winningPlan.stage === "COLLSCAN" ? "COLLSCAN (No Index)" : attExplain.queryPlanner.winningPlan.stage));
    console.log("Docs Examined:", attExplain.executionStats.totalDocsExamined);
    
    // 2. ClassJoinRequest
    console.log("\n--- ClassJoinRequest.countDocuments({ classId: { $in: [...] }, status: 'pending' }) ---");
    const joinExplain = await ClassJoinRequest.find({ classId: { $in: mockClassIds }, status: "pending" }).explain("executionStats");
    console.log("Index used:", joinExplain.queryPlanner.winningPlan.inputStage ? joinExplain.queryPlanner.winningPlan.inputStage.indexName : (joinExplain.queryPlanner.winningPlan.stage === "COLLSCAN" ? "COLLSCAN (No Index)" : joinExplain.queryPlanner.winningPlan.stage));
    console.log("Docs Examined:", joinExplain.executionStats.totalDocsExamined);

    // 3. LeaveRequest
    console.log("\n--- LeaveRequest.countDocuments({ classId: { $in: [...] }, status: 'pending' }) ---");
    const leaveExplain = await LeaveRequest.find({ classId: { $in: mockClassIds }, status: "pending" }).explain("executionStats");
    console.log("Index used:", leaveExplain.queryPlanner.winningPlan.inputStage ? leaveExplain.queryPlanner.winningPlan.inputStage.indexName : (leaveExplain.queryPlanner.winningPlan.stage === "COLLSCAN" ? "COLLSCAN (No Index)" : leaveExplain.queryPlanner.winningPlan.stage));
    console.log("Docs Examined:", leaveExplain.executionStats.totalDocsExamined);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runExplain();
