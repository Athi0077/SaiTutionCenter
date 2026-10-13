const Class = require("../models/Class");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const ClassJoinRequest = require("../models/ClassJoinRequest");
const LeaveRequest = require("../models/LeaveRequest");
const Homework = require("../models/Homework");

// @desc    Get Principal Dashboard Data
// @route   GET /api/dashboard/principal
// @access  Private (Principal)
const getPrincipalDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalClasses = await Class.countDocuments();

    const today = new Date();
    today.setHours(0,0,0,0);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const AttendanceSession = require("../models/AttendanceSession");
    const sessionFilter = { attendanceDate: todayStr };
    if (req.query.session) {
      sessionFilter.session = req.query.session;
    }
    const sessionRecords = await AttendanceSession.find(sessionFilter);
    
    // Deduplicate student attendance status for today
    const studentStatusMap = new Map();
    sessionRecords.forEach(record => {
      record.records.forEach(r => {
        const sId = (r.studentId?._id || r.studentId)?.toString();
        if (sId) {
          if (!studentStatusMap.has(sId) || r.status === "present") {
            studentStatusMap.set(sId, r.status);
          }
        }
      });
    });

    let present = 0, absent = 0, leave = 0;
    studentStatusMap.forEach(status => {
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "leave") leave++;
    });

    const pendingApprovals = await User.countDocuments({ role: "teacher", status: "pending" });

    const TeacherAttendance = require("../models/TeacherAttendance");
    const teacherAttendances = await TeacherAttendance.find({ date: today, status: "present" });
    const presentTeachers = teacherAttendances.length;

    // Calculate Overall School Attendance Percentage (Students)
    const eligibleStudentsForRate = Math.max(0, totalStudents - leave);
    const overallStudentAttendancePercentage = eligibleStudentsForRate === 0 && present === 0 
      ? 0 
      : eligibleStudentsForRate === 0 && present > 0
      ? 100
      : Math.round((present / eligibleStudentsForRate) * 100);

    // Recent activity could be queried from Notifications if we saved system notifications, or just mock it.
    const recentActivity = [
      { text: "System running smoothly", date: new Date() }
    ];

    // Data will be implemented when aggregations are ready
    const monthlyAttendance = [];
    const homeworkCompletion = [];

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendance: { present, absent, leave },
        presentTeachers,
        overallStudentAttendancePercentage,
        pendingApprovals,
        recentActivity,
        monthlyAttendance,
        homeworkCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Teacher Dashboard Data
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher)
const getTeacherDashboard = async (req, res) => {
  try {
    const { getTeacherClasses } = require("../utils/teacherClassHelper");
    const classes = await getTeacherClasses(req.user._id);
    const classIds = classes.map(c => c._id);
    
    // Get unique valid students from the User collection to avoid counting deleted/dummy IDs
    const studentIdsRaw = [];
    classes.forEach(c => studentIdsRaw.push(...(c.students || [])));
    const uniqueStudentIds = [...new Set(studentIdsRaw.map(id => id.toString()))];
    
    const totalStudents = await User.countDocuments({ 
      _id: { $in: uniqueStudentIds }, 
      role: 'student' 
    });

    const today = new Date();
    today.setHours(0,0,0,0);

    const attStats = await Attendance.aggregate([
      { $match: { classId: { $in: classIds }, date: today } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    let present = 0, absent = 0, leave = 0;
    attStats.forEach(stat => {
      if (stat._id === "present") present = stat.count;
      else if (stat._id === "absent") absent = stat.count;
      else if (stat._id === "leave") leave = stat.count;
    });

    const pendingJoinRequests = await ClassJoinRequest.countDocuments({ classId: { $in: classIds }, status: "pending" });
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ classId: { $in: classIds }, status: "pending" });

    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);
    
    const teacherHomeworks = await Homework.find({ teacherId: req.user._id });
    const homeworkAssignedCount = teacherHomeworks.length;
    
    const hwIds = teacherHomeworks.map(h => h._id);
    const HomeworkSubmission = require("../models/HomeworkSubmission");
    const pendingSubmissionsCount = await HomeworkSubmission.countDocuments({ 
      homeworkId: { $in: hwIds },
      status: "pending_approval"
    });

    const homeworkDueToday = teacherHomeworks.filter(h => {
      const hDate = new Date(h.dueDate);
      return hDate >= today && hDate < endOfToday;
    }).map(h => ({ _id: h._id, title: h.title, subjectId: h.subjectId }));

    const TeacherAttendance = require("../models/TeacherAttendance");
    const myAttRecord = await TeacherAttendance.findOne({ teacherId: req.user._id, date: today });
    const myAttendance = myAttRecord ? myAttRecord.status === "present" : false;

    res.json({
      success: true,
      data: {
        myClassesCount: classes.length,
        totalStudents,
        todayAttendance: { present, absent, leave },
        pendingRequests: {
          join: pendingJoinRequests,
          leave: pendingLeaveRequests
        },
        homeworkDueToday,
        homeworkAssignedCount,
        pendingSubmissionsCount,
        myAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Dashboard Data
// @route   GET /api/dashboard/student
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    
    const today = new Date();
    today.setHours(0,0,0,0);

    let todayAttendanceStatus = "Not marked";
    let hwStats = {
      total: 0,
      pending: 0,
      approvalPending: 0,
      completed: 0,
      revisionRequired: 0,
    };
    let attendancePercentage = 0;
    let streak = 0;
    let rank = "N/A";

    let todaysHomework = [];
    let upcomingDeadlines = [];
    let recentSubmissions = [];
    let subjectsOverview = [];
    let announcements = [];

    if (studentClass) {
      const att = await Attendance.findOne({ studentId: req.user._id, classId: studentClass._id, date: today });
      if (att) todayAttendanceStatus = att.status;

      const HomeworkSubmission = require("../models/HomeworkSubmission");
      const Subject = require("../models/Subject");
      const Notification = require("../models/Notification");
      
      const publishedHomeworks = await Homework.find({ classId: studentClass._id, status: "published" }).populate("subjectId", "name code");
      const hwIds = publishedHomeworks.map(h => h._id);

      const submissions = await HomeworkSubmission.find({ studentId: req.user._id, homeworkId: { $in: hwIds } }).populate({
        path: "homeworkId",
        populate: { path: "subjectId", select: "name code" }
      }).sort({ submittedAt: -1 }).limit(5);
      
      hwStats.total = publishedHomeworks.length;

      const endOfToday = new Date(today);
      endOfToday.setDate(endOfToday.getDate() + 1);

      publishedHomeworks.forEach(hw => {
        const sub = submissions.find(s => s.homeworkId?._id?.toString() === hw._id.toString());
        if (!sub) {
          hwStats.pending++; // Assigned but not requested
        } else if (sub.status === "pending_approval") {
          hwStats.approvalPending++;
        } else if (sub.status === "approved") {
          hwStats.completed++;
        } else if (sub.status === "revision_required") {
          hwStats.revisionRequired++;
        }
        
        // Populate Today's Homework
        const dueDate = new Date(hw.dueDate);
        if (dueDate >= today && dueDate < endOfToday) {
          todaysHomework.push({
            _id: hw._id,
            title: hw.subjectId?.name || "Subject",
            desc: hw.title,
            due: "Due Today"
          });
        }
        // Populate Upcoming Deadlines
        else if (dueDate >= endOfToday) {
          upcomingDeadlines.push({
            _id: hw._id,
            title: hw.subjectId?.name || "Subject",
            desc: hw.title,
            dueDate: hw.dueDate
          });
        }
      });
      
      // Sort upcoming deadlines
      upcomingDeadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      upcomingDeadlines = upcomingDeadlines.slice(0, 5); // Take top 5

      // Optimize: Aggregation for total present and absent
      const attStats = await Attendance.aggregate([
        { $match: { studentId: req.user._id, classId: studentClass._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      let p = 0, a = 0;
      attStats.forEach(stat => {
        if (stat._id === "present") p = stat.count;
        if (stat._id === "absent") a = stat.count;
      });
      const calcTotal = p + a;
      attendancePercentage = calcTotal > 0 ? Math.round((p / calcTotal) * 100) : 0;

      // Optimize: Calculate streak without fetching all history
      const lastAbsent = await Attendance.findOne({ 
        studentId: req.user._id, 
        classId: studentClass._id, 
        status: "absent" 
      }).sort({ date: -1 }).select("date");

      const streakQuery = { 
        studentId: req.user._id, 
        classId: studentClass._id, 
        status: "present" 
      };
      if (lastAbsent) {
        streakQuery.date = { $gt: lastAbsent.date };
      }
      streak = await Attendance.countDocuments(streakQuery);

      // Compute rank based on attendance percentage as a proxy for now
      rank = "Top 50%";
      if (attendancePercentage >= 95) rank = "Top 5%";
      else if (attendancePercentage >= 90) rank = "Top 10%";
      else if (attendancePercentage >= 80) rank = "Top 25%";
      
      // Recent Submissions
      recentSubmissions = submissions.map(sub => ({
        _id: sub._id,
        title: sub.homeworkId ? `${sub.homeworkId.subjectId?.name} - ${sub.homeworkId.title}` : "Unknown Assignment",
        date: sub.submittedAt || sub.createdAt,
        status: sub.status === "approved" ? "Graded" : (sub.status === "revision_required" ? "Revision" : "Pending"),
        score: sub.status === "approved" && sub.marks != null ? `${sub.marks}/${sub.maxMarks || 10}` : "-"
      }));
      
      // Subjects Overview
      const subjects = await Subject.find({ _id: { $in: studentClass.subjects || [] } });
      subjectsOverview = subjects.map(sub => ({
        _id: sub._id,
        name: sub.name,
        topics: 0, // Mock for now
        progress: 0 // Mock for now
      }));
      
      // Announcements
      announcements = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 }).limit(5);
    }

    res.json({
      success: true,
      data: {
        className: studentClass ? studentClass.className : "No Class Assigned",
        isClassLeader: studentClass && studentClass.classLeader && studentClass.classLeader.toString() === req.user._id.toString() ? true : false,
        todayAttendance: todayAttendanceStatus,
        hwStats,
        attendancePercentage,
        streak,
        rank,
        todaysHomework,
        upcomingDeadlines,
        recentSubmissions,
        subjectsOverview,
        announcements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Parent Dashboard Data
// @route   GET /api/dashboard/parent
// @access  Private (Parent)
const getParentDashboard = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate("children");
    
    if (!parent || !parent.children) {
      return res.json({ success: true, data: { children: [] } });
    }

    const childrenData = await Promise.all(parent.children.map(async (child) => {
      const childClass = await Class.findOne({ students: child._id });
      
      let attendance = [];
      let homework = [];
      let tests = [];
      let projects = [];
      let todos = [];

      if (childClass) {
        attendance = await Attendance.find({ studentId: child._id, classId: childClass._id }).sort({ date: -1 });
        
        const rawHomework = await Homework.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ dueDate: 1 });
        const HomeworkSubmission = require("../models/HomeworkSubmission");
        const hwSubs = await HomeworkSubmission.find({ studentId: child._id });
        homework = rawHomework.map(hw => {
          const sub = hwSubs.find(s => s.homeworkId.toString() === hw._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "approved") subStatus = "Completed";
            else if (sub.status === "pending_approval") subStatus = "Submitted";
            else if (sub.status === "revision_required") subStatus = "Revision Needed";
          }
          return { ...hw.toObject(), studentStatus: subStatus };
        });
        
        const Test = require("../models/Test");
        const TestSubmission = require("../models/TestSubmission");
        const rawTests = await Test.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ testDate: 1 });
        const testSubs = await TestSubmission.find({ studentId: child._id });
        tests = rawTests.map(test => {
          const sub = testSubs.find(s => s.testId.toString() === test._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "graded") subStatus = "Completed";
            else if (sub.status === "submitted") subStatus = "Submitted";
          }
          return { ...test.toObject(), studentStatus: subStatus };
        });

        const Project = require("../models/Project");
        const ProjectSubmission = require("../models/ProjectSubmission"); // Assuming this exists or similar
        const rawProjects = await Project.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ dueDate: 1 });
        const projSubs = await ProjectSubmission.find({ studentId: child._id }).catch(() => []); // Graceful fallback
        projects = rawProjects.map(proj => {
          const sub = projSubs.find(s => s.projectId && s.projectId.toString() === proj._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "approved") subStatus = "Completed";
            else if (sub.status === "pending_approval" || sub.status === "submitted") subStatus = "Submitted";
          }
          return { ...proj.toObject(), studentStatus: subStatus };
        });

        const Todo = require("../models/Todo");
        const rawTodos = await Todo.find({
          $or: [
            { classId: childClass._id },
            { "assignments.assignee": child._id }
          ]
        }).sort({ dueDate: 1 });
        
        todos = rawTodos.map(todo => {
          const tObj = todo.toObject();
          let subStatus = "Pending";
          // Check if specific assignment exists for this child
          const myAssignment = tObj.assignments?.find(a => a.assignee.toString() === child._id.toString());
          if (myAssignment) {
            subStatus = myAssignment.status;
          } else if (tObj.status) {
             // Fallback to general status if no specific assignment array
             subStatus = tObj.status;
          }
          return { ...tObj, studentStatus: subStatus };
        });

        // Fetch Fun Activities / Quizzes for child
        var funActivities = [];
        const Standard = require("../models/Standard");
        const Section = require("../models/Section");
        const Quiz = require("../models/Quiz");
        const QuizSubmission = require("../models/QuizSubmission");

        const standardDoc = await Standard.findOne({ name: childClass.standard });
        const sectionDoc = standardDoc ? await Section.findOne({ name: childClass.section, standardId: standardDoc._id }) : null;

        if (standardDoc && sectionDoc) {
          const rawQuizzes = await Quiz.find({ standardId: standardDoc._id, sectionId: sectionDoc._id })
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });

          const qSubs = await QuizSubmission.find({ studentId: child._id });

          funActivities = rawQuizzes.map(quiz => {
            const sub = qSubs.find(s => s.quizId.toString() === quiz._id.toString());
            let subStatus = "Pending";
            const now = new Date();
            if (sub) {
              subStatus = "Completed";
            } else if (now > quiz.endDate) {
              subStatus = "Closed";
            }
            return {
              ...quiz.toObject(),
              studentStatus: subStatus,
              submission: sub ? {
                score: sub.score,
                totalMarks: sub.totalMarks,
                percentage: sub.percentage,
                submittedAt: sub.submittedAt
              } : null
            };
          });
        }
      }

      return {
        _id: child._id,
        name: child.name,
        className: childClass ? childClass.className : "No Class Assigned",
        attendance,
        homework,
        tests,
        projects,
        todos,
        funActivities: funActivities || []
      };
    }));

    res.json({
      success: true,
      data: {
        children: childrenData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Analytics Data
// @route   GET /api/dashboard/student/analytics
// @access  Private (Student)
const getStudentAnalytics = async (req, res) => {
  try {
    const TestSubmission = require("../models/TestSubmission");
    const HomeworkSubmission = require("../models/HomeworkSubmission");
    const ExamMark = require("../models/ExamMark");
    const Subject = require("../models/Subject");
    const Class = require("../models/Class");
    
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          overallAverage: 0,
          bestSubject: "N/A",
          trend: 0,
          performanceOverTime: [],
          subjectAverages: [],
          skillDistribution: [],
          totalGraded: 0
        }
      });
    }

    const studentId = req.user._id;

    // 1. Fetch Exam Marks
    const examMarks = await ExamMark.find({
      studentId,
      marksObtained: { $ne: null }
    }).populate("subjectId", "name").populate("examId");

    // 2. Fetch Test Submissions
    const testSubmissions = await TestSubmission.find({
      studentId,
      status: "graded",
      marks: { $ne: null }
    }).populate({
      path: "testId",
      populate: { path: "subjectId", select: "name" }
    });

    // 3. Fetch Homework Submissions
    const homeworkSubmissions = await HomeworkSubmission.find({
      studentId,
      status: "approved",
      marks: { $ne: null }
    }).populate({
      path: "homeworkId",
      populate: { path: "subjectId", select: "name" }
    });

    // Aggregate all graded items
    const allGradedItems = [];

    // Process ExamMarks
    examMarks.forEach(em => {
      if (!em.subjectId?.name) return;
      const exam = em.examId;
      let maxMarks = 100;
      if (exam && exam.schedule && Array.isArray(exam.schedule)) {
        const sched = exam.schedule.find(s => s.subjectId?.toString() === em.subjectId._id?.toString());
        if (sched && sched.maxMarks) maxMarks = sched.maxMarks;
      }
      const scorePct = Math.min(100, Math.max(0, (Number(em.marksObtained) / maxMarks) * 100));
      const date = em.updatedAt || em.createdAt || new Date();
      allGradedItems.push({
        subject: em.subjectId.name,
        obtained: Number(em.marksObtained),
        max: maxMarks,
        pct: scorePct,
        date: new Date(date)
      });
    });

    // Process TestSubmissions
    testSubmissions.forEach(ts => {
      const subjectName = ts.testId?.subjectId?.name;
      if (!subjectName) return;
      const maxMarks = Number(ts.testId?.maxMarks || 100);
      const scorePct = Math.min(100, Math.max(0, (Number(ts.marks) / maxMarks) * 100));
      const date = ts.gradedAt || ts.updatedAt || ts.createdAt || new Date();
      allGradedItems.push({
        subject: subjectName,
        obtained: Number(ts.marks),
        max: maxMarks,
        pct: scorePct,
        date: new Date(date)
      });
    });

    // Process HomeworkSubmissions
    homeworkSubmissions.forEach(hs => {
      const subjectName = hs.homeworkId?.subjectId?.name;
      if (!subjectName) return;
      const maxMarks = Number(hs.maxMarks || 10);
      const scorePct = Math.min(100, Math.max(0, (Number(hs.marks) / maxMarks) * 100));
      const date = hs.reviewedAt || hs.updatedAt || hs.createdAt || new Date();
      allGradedItems.push({
        subject: subjectName,
        obtained: Number(hs.marks),
        max: maxMarks,
        pct: scorePct,
        date: new Date(date)
      });
    });

    if (allGradedItems.length === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          overallAverage: 0,
          bestSubject: "N/A",
          trend: 0,
          performanceOverTime: [],
          subjectAverages: [],
          skillDistribution: [],
          totalGraded: 0
        }
      });
    }

    // 4. Subject Averages
    const subjectMap = {};
    let totalObtainedSum = 0;
    let totalMaxSum = 0;

    allGradedItems.forEach(item => {
      if (!subjectMap[item.subject]) {
        subjectMap[item.subject] = { sumPct: 0, count: 0, sumObtained: 0, sumMax: 0 };
      }
      subjectMap[item.subject].sumPct += item.pct;
      subjectMap[item.subject].count += 1;
      subjectMap[item.subject].sumObtained += item.obtained;
      subjectMap[item.subject].sumMax += item.max;

      totalObtainedSum += item.obtained;
      totalMaxSum += item.max;
    });

    const subjectAverages = Object.keys(subjectMap).map(sub => {
      const avgGrade = Math.round(subjectMap[sub].sumPct / subjectMap[sub].count);
      return {
        subject: sub,
        grade: avgGrade,
        max: 100
      };
    });

    // Overall Average
    const overallAverage = totalMaxSum > 0 
      ? Math.round((totalObtainedSum / totalMaxSum) * 100)
      : Math.round(subjectAverages.reduce((acc, s) => acc + s.grade, 0) / subjectAverages.length);

    // Best Subject
    let bestSubName = "N/A";
    let bestSubGrade = -1;
    subjectAverages.forEach(s => {
      if (s.grade > bestSubGrade) {
        bestSubGrade = s.grade;
        bestSubName = s.subject;
      }
    });

    // 5. Performance Over Time (Grouped by Month)
    allGradedItems.sort((a, b) => a.date - b.date);
    const monthMap = {};
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

    allGradedItems.forEach(item => {
      const monthName = monthFormatter.format(item.date);
      if (!monthMap[monthName]) {
        monthMap[monthName] = { sumPct: 0, count: 0 };
      }
      monthMap[monthName].sumPct += item.pct;
      monthMap[monthName].count += 1;
    });

    const performanceOverTime = Object.keys(monthMap).map(month => ({
      month,
      score: Math.round(monthMap[month].sumPct / monthMap[month].count)
    }));

    // 6. Trend calculation (Current month vs Previous month)
    let trend = 0;
    if (performanceOverTime.length >= 2) {
      const latest = performanceOverTime[performanceOverTime.length - 1].score;
      const prev = performanceOverTime[performanceOverTime.length - 2].score;
      trend = Math.round(latest - prev);
    }

    // 7. Skill / Subject Distribution for Radar Chart
    const skillDistribution = subjectAverages.map(s => ({
      subject: s.subject,
      A: s.grade,
      fullMark: 100
    }));

    res.json({
      success: true,
      data: {
        hasData: true,
        overallAverage,
        bestSubject: bestSubName,
        trend,
        performanceOverTime,
        subjectAverages,
        skillDistribution,
        totalGraded: allGradedItems.length
      }
    });
  } catch (error) {
    console.error("Error in getStudentAnalytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPrincipalDashboard,
  getTeacherDashboard,
  getStudentDashboard,
  getParentDashboard,
  getStudentAnalytics
};
