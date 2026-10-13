const User = require("../models/User");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const Test = require("../models/Test");
const TestSubmission = require("../models/TestSubmission");
const ExamMark = require("../models/ExamMark");
const Exam = require("../models/Exam");
const Project = require("../models/Project");
const ProjectSubmission = require("../models/ProjectSubmission");
const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const Standard = require("../models/Standard");
const Section = require("../models/Section");

// Helper to compute grade from percentage
const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

// @desc    Get complete student intelligence / details for Principal
// @route   GET /api/principal/students/details/:studentId
// @access  Private (Principal only)
exports.getStudentDetailsForPrincipal = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch Student User Record
    const student = await User.findById(studentId).select("-password");
    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Principal Authorization Check: schoolId if specified
    if (req.user.schoolId && student.schoolId && req.user.schoolId.toString() !== student.schoolId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to student from another institution.",
      });
    }

    // 2. Fetch Class where Student is enrolled
    const studentClass = await Class.findOne({ students: studentId }).populate("teacherId", "name email phone");

    let standardDoc = null;
    let sectionDoc = null;
    if (studentClass) {
      standardDoc = await Standard.findOne({ name: studentClass.standard });
      if (standardDoc) {
        sectionDoc = await Section.findOne({ name: studentClass.section, standardId: standardDoc._id });
      }
    }

    // Parallel fetch for all modules
    const [
      attendanceRecords,
      allHomework,
      homeworkSubmissions,
      allTests,
      testSubmissions,
      examMarks,
      allProjects,
      projectSubmissions,
      quizSubmissions,
      assignedQuizzes
    ] = await Promise.all([
      Attendance.find({ studentId }).sort({ date: -1 }),
      studentClass ? Homework.find({ classId: studentClass._id }).sort({ createdAt: -1 }) : [],
      HomeworkSubmission.find({ studentId }).populate("homeworkId"),
      studentClass ? Test.find({ classId: studentClass._id }).sort({ createdAt: -1 }) : [],
      TestSubmission.find({ studentId }).populate("testId"),
      ExamMark.find({ studentId }).populate("examId").populate("subjectId", "name").populate("teacherId", "name"),
      studentClass ? Project.find({ classId: studentClass._id }).sort({ createdAt: -1 }) : [],
      ProjectSubmission.find({ studentId }).populate("projectId"),
      QuizSubmission.find({ studentId }).populate({
        path: "quizId",
        populate: [
          { path: "standardId", select: "name" },
          { path: "sectionId", select: "name" }
        ]
      }).sort({ submittedAt: -1 }),
      (standardDoc && sectionDoc)
        ? Quiz.find({ standardId: standardDoc._id, sectionId: sectionDoc._id }).sort({ createdAt: -1 })
        : []
    ]);

    // ----------------------------------------------------
    // A. ATTENDANCE CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    const totalAttendanceSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "absent").length;
    const leaveCount = attendanceRecords.filter((a) => a.status === "leave").length;

    const morningCount = attendanceRecords.filter((a) => a.session === "MORNING").length;
    const afternoonCount = attendanceRecords.filter((a) => a.session === "AFTERNOON").length;
    const morningPresent = attendanceRecords.filter((a) => a.session === "MORNING" && a.status === "present").length;
    const afternoonPresent = attendanceRecords.filter((a) => a.session === "AFTERNOON" && a.status === "present").length;

    const attendancePercentage = totalAttendanceSessions > 0
      ? Math.round((presentCount / totalAttendanceSessions) * 100)
      : 100;

    // Monthly attendance aggregation
    const monthlyAttendanceMap = {};
    attendanceRecords.forEach((rec) => {
      const monthYear = new Date(rec.date).toLocaleString("en-US", { month: "short", year: "numeric" });
      if (!monthlyAttendanceMap[monthYear]) {
        monthlyAttendanceMap[monthYear] = { month: monthYear, total: 0, present: 0, absent: 0, leave: 0 };
      }
      monthlyAttendanceMap[monthYear].total++;
      if (rec.status === "present") monthlyAttendanceMap[monthYear].present++;
      else if (rec.status === "absent") monthlyAttendanceMap[monthYear].absent++;
      else if (rec.status === "leave") monthlyAttendanceMap[monthYear].leave++;
    });

    const monthlyAttendance = Object.values(monthlyAttendanceMap).map((m) => ({
      ...m,
      percentage: Math.round((m.present / m.total) * 100),
    }));

    // ----------------------------------------------------
    // B. HOMEWORK CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    const hwSubmissionMap = {};
    homeworkSubmissions.forEach((sub) => {
      if (sub.homeworkId) {
        hwSubmissionMap[sub.homeworkId._id.toString()] = sub;
      }
    });

    const homeworkList = allHomework.map((hw) => {
      const sub = hwSubmissionMap[hw._id.toString()];
      let submissionStatus = "pending";
      let submittedAt = null;
      let marksObtained = null;
      let maxMarks = hw.maxMarks || 100;
      let feedback = "";

      if (sub) {
        submissionStatus = sub.status === "approved" ? "completed" : sub.status;
        submittedAt = sub.submittedAt;
        marksObtained = sub.marks !== undefined ? sub.marks : null;
        feedback = sub.feedback || "";
      } else if (new Date() > new Date(hw.dueDate)) {
        submissionStatus = "late_unsubmitted";
      }

      return {
        homeworkId: hw._id,
        title: hw.title,
        subject: hw.subject || "General",
        assignedDate: hw.createdAt,
        dueDate: hw.dueDate,
        status: submissionStatus,
        submittedAt,
        marksObtained,
        maxMarks,
        feedback,
      };
    });

    const completedHwCount = homeworkList.filter((h) => h.status === "completed" || h.status === "approved").length;
    const pendingHwCount = homeworkList.filter((h) => h.status === "pending").length;
    const lateHwCount = homeworkList.filter((h) => h.status === "late_unsubmitted").length;
    const homeworkCompletionRate = allHomework.length > 0
      ? Math.round((completedHwCount / allHomework.length) * 100)
      : 100;

    // ----------------------------------------------------
    // C. TESTS CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    const testSubMap = {};
    testSubmissions.forEach((sub) => {
      if (sub.testId) {
        testSubMap[sub.testId._id.toString()] = sub;
      }
    });

    let totalTestPctSum = 0;
    let gradedTestCount = 0;

    const testList = allTests.map((test) => {
      const sub = testSubMap[test._id.toString()];
      const marksObtained = sub ? sub.marks : null;
      const maxMarks = test.maxMarks || 100;
      const percentage = (marksObtained !== null && maxMarks > 0)
        ? Math.round((marksObtained / maxMarks) * 100)
        : null;

      if (percentage !== null) {
        totalTestPctSum += percentage;
        gradedTestCount++;
      }

      return {
        testId: test._id,
        title: test.title,
        subject: test.subject || "General",
        date: test.testDate || test.createdAt,
        marksObtained,
        maxMarks,
        percentage,
        feedback: sub ? sub.feedback || "" : "",
        status: sub ? sub.status : "unsubmitted",
      };
    });

    const testAverage = gradedTestCount > 0 ? Math.round(totalTestPctSum / gradedTestCount) : 0;

    // ----------------------------------------------------
    // D. EXAMS CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    let totalExamPctSum = 0;
    let gradedExamCount = 0;

    const examList = examMarks.map((em) => {
      const maxMarks = em.examId?.maxMarks || 100;
      const marksObtained = em.isAbsent ? 0 : em.marksObtained;
      const percentage = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;

      if (!em.isAbsent) {
        totalExamPctSum += percentage;
        gradedExamCount++;
      }

      return {
        examMarkId: em._id,
        examName: em.examId?.name || "Term Exam",
        subject: em.subjectId?.name || em.subject || "General",
        teacherName: em.teacherId?.name || "Class Teacher",
        marksObtained,
        maxMarks,
        isAbsent: em.isAbsent,
        percentage,
        grade: getGrade(percentage),
        remarks: em.remarks || "",
        status: em.status,
      };
    });

    const examAverage = gradedExamCount > 0 ? Math.round(totalExamPctSum / gradedExamCount) : 0;

    // ----------------------------------------------------
    // E. PROJECTS CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    const projSubMap = {};
    projectSubmissions.forEach((sub) => {
      if (sub.projectId) {
        projSubMap[sub.projectId._id.toString()] = sub;
      }
    });

    let totalProjPctSum = 0;
    let gradedProjCount = 0;

    const projectList = allProjects.map((proj) => {
      const sub = projSubMap[proj._id.toString()];
      const marksObtained = sub ? sub.marks : null;
      const maxMarks = proj.maxMarks || 100;
      const percentage = (marksObtained !== null && maxMarks > 0)
        ? Math.round((marksObtained / maxMarks) * 100)
        : null;

      if (percentage !== null) {
        totalProjPctSum += percentage;
        gradedProjCount++;
      }

      return {
        projectId: proj._id,
        title: proj.title,
        subject: proj.subject || "General",
        assignedDate: proj.createdAt,
        dueDate: proj.dueDate,
        submittedAt: sub ? sub.submittedAt : null,
        status: sub ? sub.status : "pending",
        marksObtained,
        maxMarks,
        percentage,
        feedback: sub ? sub.feedback || "" : "",
      };
    });

    const projectAverage = gradedProjCount > 0 ? Math.round(totalProjPctSum / gradedProjCount) : 0;

    // ----------------------------------------------------
    // F. FUN ACTIVITIES CALCULATIONS & SUMMARY
    // ----------------------------------------------------
    const categoryCounts = {
      quiz: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      maths_challenge: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      word_scramble: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      image_challenge: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      puzzle: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      true_false: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      fill_blank: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
      match_pair: { assigned: 0, completed: 0, totalScore: 0, totalMarks: 0 },
    };

    assignedQuizzes.forEach((q) => {
      const type = q.activityType || "quiz";
      if (categoryCounts[type]) {
        categoryCounts[type].assigned++;
      }
    });

    let totalQuizPctSum = 0;
    const recentActivityAttempts = quizSubmissions.map((sub) => {
      const quiz = sub.quizId;
      const type = quiz ? (quiz.activityType || "quiz") : "quiz";

      if (categoryCounts[type]) {
        categoryCounts[type].completed++;
        categoryCounts[type].totalScore += sub.score;
        categoryCounts[type].totalMarks += sub.totalMarks;
      }

      totalQuizPctSum += sub.percentage;

      return {
        submissionId: sub._id,
        title: quiz ? quiz.title : "Fun Activity",
        activityType: type,
        subject: quiz ? quiz.subject : "General",
        score: sub.score,
        totalMarks: sub.totalMarks,
        percentage: sub.percentage,
        submittedAt: sub.submittedAt,
        timeTaken: sub.timeTaken,
      };
    });

    const totalActivitiesAssigned = assignedQuizzes.length;
    const totalActivitiesCompleted = quizSubmissions.length;
    const pendingActivitiesCount = Math.max(0, totalActivitiesAssigned - totalActivitiesCompleted);
    const activityAverage = totalActivitiesCompleted > 0
      ? Math.round(totalQuizPctSum / totalActivitiesCompleted)
      : 0;

    const categoryPerformance = Object.entries(categoryCounts).map(([catKey, val]) => {
      const avgPct = val.totalMarks > 0 ? Math.round((val.totalScore / val.totalMarks) * 100) : 0;
      return {
        category: catKey,
        assigned: val.assigned,
        completed: val.completed,
        averagePercentage: avgPct,
      };
    });

    // ----------------------------------------------------
    // G. OVERALL ACADEMIC SCORE & PERFORMANCE ANALYTICS
    // ----------------------------------------------------
    const academicComponents = [];
    if (gradedExamCount > 0) academicComponents.push(examAverage);
    if (gradedTestCount > 0) academicComponents.push(testAverage);
    if (gradedProjCount > 0) academicComponents.push(projectAverage);
    if (allHomework.length > 0) academicComponents.push(homeworkCompletionRate);

    const overallAcademicScore = academicComponents.length > 0
      ? Math.round(academicComponents.reduce((a, b) => a + b, 0) / academicComponents.length)
      : 100;

    // ----------------------------------------------------
    // H. RECENT ACTIVITY TIMELINE (Chronological 10 Latest Events)
    // ----------------------------------------------------
    const timelineEvents = [];

    // Homework events
    homeworkSubmissions.forEach((sub) => {
      if (sub.submittedAt && sub.homeworkId) {
        timelineEvents.push({
          id: `hw-${sub._id}`,
          type: "homework",
          title: `Submitted Homework: ${sub.homeworkId.title}`,
          subtitle: `Subject: ${sub.homeworkId.subject || "General"}`,
          date: sub.submittedAt,
          badgeText: sub.status === "approved" ? "Approved" : "Submitted",
          badgeColor: "bg-blue-100 text-blue-700",
        });
      }
    });

    // Test events
    testSubmissions.forEach((sub) => {
      if (sub.submittedAt && sub.testId) {
        timelineEvents.push({
          id: `test-${sub._id}`,
          type: "test",
          title: `Completed Test: ${sub.testId.title}`,
          subtitle: `Score: ${sub.marks !== undefined ? sub.marks : "-"} Marks`,
          date: sub.submittedAt,
          badgeText: "Test Graded",
          badgeColor: "bg-purple-100 text-purple-700",
        });
      }
    });

    // Exam events
    examMarks.forEach((em) => {
      if (em.updatedAt && em.examId) {
        timelineEvents.push({
          id: `exam-${em._id}`,
          type: "exam",
          title: `Exam Score: ${em.examId.name || "Exam"}`,
          subtitle: `${em.subjectId?.name || em.subject}: ${em.isAbsent ? "Absent" : `${em.marksObtained} Marks`}`,
          date: em.updatedAt,
          badgeText: `Grade ${getGrade(em.marksObtained)}`,
          badgeColor: "bg-emerald-100 text-emerald-700",
        });
      }
    });

    // Project events
    projectSubmissions.forEach((sub) => {
      if (sub.submittedAt && sub.projectId) {
        timelineEvents.push({
          id: `proj-${sub._id}`,
          type: "project",
          title: `Project Submission: ${sub.projectId.title}`,
          subtitle: `Subject: ${sub.projectId.subject || "General"}`,
          date: sub.submittedAt,
          badgeText: sub.status,
          badgeColor: "bg-amber-100 text-amber-700",
        });
      }
    });

    // Quiz / Fun Activity events
    quizSubmissions.forEach((sub) => {
      if (sub.submittedAt && sub.quizId) {
        timelineEvents.push({
          id: `quiz-${sub._id}`,
          type: "fun_activity",
          title: `Completed Activity: ${sub.quizId.title}`,
          subtitle: `Score: ${sub.score}/${sub.totalMarks} (${sub.percentage}%)`,
          date: sub.submittedAt,
          badgeText: `${sub.percentage}% Score`,
          badgeColor: "bg-rose-100 text-rose-700",
        });
      }
    });

    // Attendance events (latest 5)
    attendanceRecords.slice(0, 5).forEach((att) => {
      timelineEvents.push({
        id: `att-${att._id}`,
        type: "attendance",
        title: `Attendance Marked: ${att.status.toUpperCase()}`,
        subtitle: `Session: ${att.session || "MORNING"} • Date: ${new Date(att.date).toLocaleDateString()}`,
        date: att.markedAt || att.date,
        badgeText: att.status.toUpperCase(),
        badgeColor: att.status === "present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
      });
    });

    // Sort timeline descending by date and slice top 12 events
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivityTimeline = timelineEvents.slice(0, 12);

    // Fetch linked parent account if exists
    const linkedParent = await User.findOne({ role: "parent", children: student._id });
    const rawParentName = linkedParent ? linkedParent.name : (student.contactDetails?.parentName || student.parentName);
    const rawParentPhone = linkedParent ? (linkedParent.mobileNumber || linkedParent.phone) : (student.contactDetails?.parentPhone || student.parentPhone);
    const rawEmergencyContact = student.contactDetails?.parentPhone || (linkedParent ? (linkedParent.mobileNumber || linkedParent.phone) : null) || student.phone;
    const rawAddress = student.address || student.contactDetails?.address;

    const resolvedParentName = rawParentName && String(rawParentName).trim() ? String(rawParentName).trim() : "N/A";
    const resolvedParentPhone = rawParentPhone && String(rawParentPhone).trim() ? String(rawParentPhone).trim() : "N/A";
    const resolvedEmergencyContact = rawEmergencyContact && String(rawEmergencyContact).trim() ? String(rawEmergencyContact).trim() : "N/A";
    const resolvedAddress = rawAddress && String(rawAddress).trim() ? String(rawAddress).trim() : "N/A";

    // ----------------------------------------------------
    // FINAL RESPONSE PAYLOAD
    // ----------------------------------------------------
    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          profilePic: student.profilePic || "",
          studentId: student.studentId || "N/A",
          grNumber: student.grNumber || "N/A",
          gender: student.gender || "Not specified",
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth : null,
          bloodGroup: student.bloodGroup || "Not specified",
          phone: student.phone || "N/A",
          address: resolvedAddress,
          parentName: resolvedParentName,
          parentPhone: resolvedParentPhone,
          emergencyContact: resolvedEmergencyContact,
          status: student.status,
          createdAt: student.createdAt,
        },
        class: studentClass
          ? {
              id: studentClass._id,
              className: studentClass.className,
              standard: studentClass.standard,
              section: studentClass.section,
              teacherName: studentClass.teacherId?.name || "Not assigned",
              teacherEmail: studentClass.teacherId?.email || "",
            }
          : null,
        metrics: {
          attendancePercentage,
          overallAcademicScore,
          activityAverage,
          homeworkCompletionRate,
          testAverage,
          examAverage,
          projectAverage,
        },
        personalFamilyDetails: {
          name: student.name,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          admissionNumber: student.studentId || student.grNumber || "N/A",
          grNumber: student.grNumber || "N/A",
          rollNumber: student.studentId || "N/A",
          bloodGroup: student.bloodGroup || "Not specified",
          classSection: studentClass ? studentClass.className : "Unassigned",
          phone: student.phone || "N/A",
          address: resolvedAddress,
          parentName: resolvedParentName,
          parentPhone: resolvedParentPhone,
          emergencyContact: resolvedEmergencyContact,
        },
        attendance: {
          overallPercentage: attendancePercentage,
          totalSessions: totalAttendanceSessions,
          presentCount,
          absentCount,
          leaveCount,
          morningCount,
          afternoonCount,
          morningPresent,
          afternoonPresent,
          monthlyAttendance,
          recentRecords: attendanceRecords.slice(0, 20),
        },
        homework: {
          completionRate: homeworkCompletionRate,
          totalAssigned: allHomework.length,
          completedCount: completedHwCount,
          pendingCount: pendingHwCount,
          lateCount: lateHwCount,
          homeworkList,
        },
        tests: {
          testAverage,
          totalTests: allTests.length,
          gradedTestsCount: gradedTestCount,
          testList,
        },
        exams: {
          examAverage,
          totalExams: examMarks.length,
          overallGrade: getGrade(examAverage),
          examList,
        },
        projects: {
          projectAverage,
          totalProjects: allProjects.length,
          completedProjects: projectSubmissions.length,
          projectList,
        },
        funActivities: {
          activityAverage,
          totalAssigned: totalActivitiesAssigned,
          totalCompleted: totalActivitiesCompleted,
          pendingCount: pendingActivitiesCount,
          categoryPerformance,
          recentAttempts: recentActivityAttempts,
        },
        performanceAnalytics: {
          academicTrend: [
            { component: "Homework", score: homeworkCompletionRate },
            { component: "Tests", score: testAverage },
            { component: "Exams", score: examAverage },
            { component: "Projects", score: projectAverage },
            { component: "Activities", score: activityAverage },
          ],
          attendanceRate: attendancePercentage,
          overallAcademicScore,
        },
        recentActivityTimeline,
      },
    });
  } catch (error) {
    console.error("Error in getStudentDetailsForPrincipal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
