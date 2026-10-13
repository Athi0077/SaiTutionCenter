const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const TeacherAssignment = require("../models/TeacherAssignment");
const Standard = require("../models/Standard");
const Section = require("../models/Section");
const Class = require("../models/Class");
const User = require("../models/User");

// Helper to scramble a word for Word Scramble activity
const scrambleWord = (word) => {
  if (!word) return "";
  const arr = word.toUpperCase().split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join(" ");
  // Avoid returning identical string if word length > 2
  if (scrambled.replace(/ /g, "") === word.toUpperCase() && word.length > 2) {
    return scrambleWord(word);
  }
  return scrambled;
};

// Helper to check if an activity start date is on a future day
// If the start date falls on today's calendar date or earlier, it is considered ACTIVE today.
const isActivityComingSoon = (startDate, now = new Date()) => {
  if (!startDate) return false;
  const start = new Date(startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return startDay > todayDay;
};

// @desc    Get teacher's assigned standards, sections, and subjects for activity creation
// @route   GET /api/fun-activities/teacher-assignments
// @access  Private (Teacher)
exports.getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const assignments = await TeacherAssignment.find({ teacherId })
      .populate("standardId", "name")
      .populate("sectionId", "name");

    const standardsMap = {};

    assignments.forEach((asg) => {
      if (!asg.standardId || !asg.sectionId) return;

      const stdId = asg.standardId._id.toString();
      const stdName = asg.standardId.name;
      const secId = asg.sectionId._id.toString();
      const secName = asg.sectionId.name;
      const subject = asg.subject;

      if (!standardsMap[stdId]) {
        standardsMap[stdId] = {
          standardId: stdId,
          standardName: stdName,
          sectionsMap: {},
        };
      }

      if (!standardsMap[stdId].sectionsMap[secId]) {
        standardsMap[stdId].sectionsMap[secId] = {
          sectionId: secId,
          sectionName: secName,
          subjects: new Set(),
        };
      }

      if (subject) {
        standardsMap[stdId].sectionsMap[secId].subjects.add(subject);
      }
    });

    const formattedAssignments = Object.values(standardsMap).map((std) => ({
      standardId: std.standardId,
      standardName: std.standardName,
      sections: Object.values(std.sectionsMap).map((sec) => ({
        sectionId: sec.sectionId,
        sectionName: sec.sectionName,
        subjects: Array.from(sec.subjects),
      })),
    }));

    res.json({ success: true, data: formattedAssignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Activity (Quiz, Maths, Word Scramble, Image, Puzzle, True/False, Fill Blank, Match Pair)
// @route   POST /api/fun-activities/quizzes
// @access  Private (Teacher)
exports.createQuiz = async (req, res) => {
  try {
    const {
      activityType = "quiz",
      title,
      description,
      standardId,
      sectionId,
      subject,
      startDate,
      endDate,
      timeLimit,
      questions,
    } = req.body;

    const teacherId = req.user._id;

    const validTypes = [
      "quiz",
      "maths_challenge",
      "word_scramble",
      "image_challenge",
      "puzzle",
      "true_false",
      "fill_blank",
      "match_pair",
    ];

    const type = validTypes.includes(activityType) ? activityType : "quiz";

    if (!title || !standardId || !sectionId || !subject || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (title, standard, section, subject, start date, end date).",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Activity must have at least one question or item.",
      });
    }

    // STRICT BACKEND AUTHORIZATION: Verify teacher assignment in TeacherAssignment collection
    const teacherAssignments = await TeacherAssignment.find({
      teacherId,
      standardId,
      sectionId,
    });

    if (!teacherAssignments || teacherAssignments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create an activity for this class/subject.",
      });
    }

    const hasSubjectAccess = teacherAssignments.some((asg) => {
      if (asg.isClassTeacher) return true;
      if (asg.subject && asg.subject.toLowerCase() === subject.trim().toLowerCase()) return true;
      return false;
    });

    if (!hasSubjectAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create an activity for this class/subject.",
      });
    }

    // Validate Items according to activityType
    let calculatedTotalMarks = 0;
    const validatedItems = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qMarks = Number(q.marks) > 0 ? Number(q.marks) : 1;

      if (type === "quiz" || type === "maths_challenge" || type === "puzzle" || type === "image_challenge") {
        if (!q.question || !q.question.trim()) {
          return res.status(400).json({ success: false, message: `Item ${i + 1} question text is required.` });
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
          return res.status(400).json({ success: false, message: `Item ${i + 1} must have 4 options (A, B, C, D).` });
        }
        if (!q.correctAnswer) {
          return res.status(400).json({ success: false, message: `Item ${i + 1} correct answer is required.` });
        }
        validatedItems.push({
          question: q.question.trim(),
          options: q.options.map((o) => ({ key: o.key, text: o.text ? o.text.trim() : "" })),
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : "",
          marks: qMarks,
        });
      } else if (type === "word_scramble") {
        if (!q.word || !q.word.trim()) {
          return res.status(400).json({ success: false, message: `Word ${i + 1} is required.` });
        }
        validatedItems.push({
          word: q.word.trim().toUpperCase(),
          hint: q.hint ? q.hint.trim() : "",
          marks: qMarks,
        });
      } else if (type === "true_false") {
        if (!q.statement || !q.statement.trim()) {
          return res.status(400).json({ success: false, message: `Statement ${i + 1} is required.` });
        }
        const isTrueVal = String(q.correctAnswer || q.isTrue).toLowerCase() === "true";
        validatedItems.push({
          statement: q.statement.trim(),
          isTrue: isTrueVal,
          correctAnswer: isTrueVal ? "true" : "false",
          marks: qMarks,
        });
      } else if (type === "fill_blank") {
        if (!q.blankQuestion || !q.blankQuestion.trim()) {
          return res.status(400).json({ success: false, message: `Question ${i + 1} text is required.` });
        }
        if (!q.blankAnswer || !q.blankAnswer.trim()) {
          return res.status(400).json({ success: false, message: `Answer for blank ${i + 1} is required.` });
        }
        validatedItems.push({
          blankQuestion: q.blankQuestion.trim(),
          blankAnswer: q.blankAnswer.trim(),
          marks: qMarks,
        });
      } else if (type === "match_pair") {
        if (!q.leftItem || !q.leftItem.trim() || !q.rightItem || !q.rightItem.trim()) {
          return res.status(400).json({ success: false, message: `Match Pair ${i + 1} requires both Left and Right items.` });
        }
        validatedItems.push({
          leftItem: q.leftItem.trim(),
          rightItem: q.rightItem.trim(),
          marks: qMarks,
        });
      }

      calculatedTotalMarks += qMarks;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start or end date format." });
    }

    if (end <= start) {
      return res.status(400).json({ success: false, message: "End date must be after start date." });
    }

    const newActivity = await Quiz.create({
      activityType: type,
      title: title.trim(),
      description: description ? description.trim() : "",
      standardId,
      sectionId,
      subject: subject.trim(),
      createdBy: teacherId,
      questions: validatedItems,
      totalMarks: calculatedTotalMarks,
      startDate: start,
      endDate: end,
      timeLimit: Number(timeLimit) > 0 ? Number(timeLimit) : 0,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Activity created and assigned successfully!",
      data: newActivity,
    });
  } catch (error) {
    console.error("Error in createQuiz:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activities created by logged-in teacher
// @route   GET /api/fun-activities/quizzes/teacher
// @access  Private (Teacher)
exports.getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { activityType } = req.query;

    let query = { createdBy: teacherId };
    if (activityType) query.activityType = activityType;

    const quizzes = await Quiz.find(query)
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    const enhancedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizObj = quiz.toObject();
        const submissionsCount = await QuizSubmission.countDocuments({ quizId: quiz._id });

        const stdName = quiz.standardId?.name;
        const secName = quiz.sectionId?.name;
        let totalEnrolled = 0;
        if (stdName && secName) {
          const studentClass = await Class.findOne({
            standard: stdName,
            section: secName,
          });
          if (studentClass && studentClass.students) {
            totalEnrolled = studentClass.students.length;
          }
        }

        let averageScore = 0;
        if (submissionsCount > 0) {
          const aggregate = await QuizSubmission.aggregate([
            { $match: { quizId: quiz._id } },
            { $group: { _id: null, avgPercentage: { $avg: "$percentage" } } },
          ]);
          if (aggregate.length > 0) {
            averageScore = Math.round(aggregate[0].avgPercentage);
          }
        }

        const now = new Date();
        let displayStatus = "active";
        if (now > quiz.endDate) displayStatus = "closed";
        else if (isActivityComingSoon(quiz.startDate, now)) displayStatus = "coming_soon";

        return {
          ...quizObj,
          displayStatus,
          totalSubmissions: submissionsCount,
          totalEnrolled,
          averageScore,
        };
      })
    );

    res.json({ success: true, data: enhancedQuizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activities assigned to student's standard + section
// @route   GET /api/fun-activities/quizzes/student
// @access  Private (Student)
exports.getStudentQuizzes = async (req, res) => {
  try {
    let studentId = req.user._id;
    const { activityType } = req.query;

    if (req.user.role === "parent") {
      const parentUser = await User.findById(req.user._id);
      if (!parentUser || !parentUser.children || parentUser.children.length === 0) {
        return res.status(404).json({ success: false, message: "No children linked to account." });
      }
      studentId = req.query.studentId || parentUser.children[0];
    }

    const studentClass = await Class.findOne({ students: studentId });
    if (!studentClass) {
      return res.json({ success: true, data: [] });
    }

    const standardDoc = await Standard.findOne({ name: studentClass.standard });
    if (!standardDoc) return res.json({ success: true, data: [] });

    const sectionDoc = await Section.findOne({
      name: studentClass.section,
      standardId: standardDoc._id,
    });
    if (!sectionDoc) return res.json({ success: true, data: [] });

    let query = {
      standardId: standardDoc._id,
      sectionId: sectionDoc._id,
    };

    if (activityType) query.activityType = activityType;

    const quizzes = await Quiz.find(query)
      .populate("createdBy", "name")
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    const studentQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizObj = quiz.toObject();

        const submission = await QuizSubmission.findOne({
          quizId: quiz._id,
          studentId,
        });

        let status = "active";
        if (submission) {
          status = "completed";
        } else if (now > quiz.endDate) {
          status = "closed";
        } else if (isActivityComingSoon(quiz.startDate, now)) {
          status = "coming_soon";
        }

        // Hide items details from list payload
        delete quizObj.questions;

        return {
          ...quizObj,
          questionCount: quiz.questions ? quiz.questions.length : 0,
          studentStatus: status,
          submission: submission
            ? {
                score: submission.score,
                totalMarks: submission.totalMarks,
                percentage: submission.percentage,
                submittedAt: submission.submittedAt,
                timeTaken: submission.timeTaken,
              }
            : null,
        };
      })
    );

    res.json({ success: true, data: studentQuizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single Activity by ID (sanitized for unsubmitted student view)
// @route   GET /api/fun-activities/quizzes/:id
// @access  Private
exports.getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId)
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Activity not found." });
    }

    const quizObj = quiz.toObject();

    if (req.user.role === "student") {
      let studentId = req.user._id;

      const studentClass = await Class.findOne({ students: studentId });
      if (
        !studentClass ||
        studentClass.standard !== quiz.standardId?.name ||
        studentClass.section !== quiz.sectionId?.name
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this activity.",
        });
      }

      const submission = await QuizSubmission.findOne({ quizId: quiz._id, studentId });
      quizObj.submission = submission;

      // If NOT submitted yet, sanitize answers based on activityType
      if (!submission) {
        const type = quizObj.activityType || "quiz";
        quizObj.questions = quizObj.questions.map((q) => {
          const sanitized = { ...q };

          if (type === "quiz" || type === "maths_challenge" || type === "puzzle" || type === "image_challenge") {
            delete sanitized.correctAnswer;
          } else if (type === "word_scramble") {
            sanitized.scrambledWord = scrambleWord(q.word);
            delete sanitized.word;
          } else if (type === "true_false") {
            delete sanitized.isTrue;
            delete sanitized.correctAnswer;
          } else if (type === "fill_blank") {
            delete sanitized.blankAnswer;
          } else if (type === "match_pair") {
            delete sanitized.rightItem;
          }

          return sanitized;
        });

        // For Match the Pair: provide a shuffled array of all right items so student can pair them
        if (type === "match_pair") {
          const rightItems = quiz.questions.map((q) => q.rightItem).filter(Boolean);
          // Shuffle rightItems
          for (let i = rightItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
          }
          quizObj.shuffledRightItems = rightItems;
        }
      }
    }

    res.json({ success: true, data: quizObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Activity answers by Student (Server-side score calculation)
// @route   POST /api/fun-activities/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers, timeTaken } = req.body; // answers: [{ questionId, selectedAnswer }]
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId).populate("standardId").populate("sectionId");
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Activity not found." });
    }

    const studentClass = await Class.findOne({ students: studentId });
    if (
      !studentClass ||
      studentClass.standard !== quiz.standardId?.name ||
      studentClass.section !== quiz.sectionId?.name
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to participate in this activity.",
      });
    }

    const now = new Date();

    if (isActivityComingSoon(quiz.startDate, now)) {
      return res.status(400).json({ success: false, message: "This activity has not started yet." });
    }

    if (now > quiz.endDate) {
      return res.status(400).json({ success: false, message: "This activity is closed." });
    }

    // STRICT BACKEND CHECK: Prevent duplicate submissions
    const existingSubmission = await QuizSubmission.findOne({ quizId: quiz._id, studentId });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this activity.",
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Invalid answers submitted." });
    }

    // SERVER-SIDE SCORE CALCULATION PER ACTIVITY TYPE
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const processedAnswers = [];
    const type = quiz.activityType || "quiz";

    quiz.questions.forEach((q) => {
      const studentAns = answers.find(
        (a) => a.questionId && a.questionId.toString() === q._id.toString()
      );

      const submittedVal = studentAns ? String(studentAns.selectedAnswer || "").trim() : "";
      let isCorrect = false;

      if (type === "quiz" || type === "maths_challenge" || type === "puzzle" || type === "image_challenge") {
        isCorrect = submittedVal.toUpperCase() === String(q.correctAnswer || "").toUpperCase();
      } else if (type === "word_scramble") {
        isCorrect = submittedVal.toLowerCase() === String(q.word || "").toLowerCase();
      } else if (type === "true_false") {
        const expectedBool = q.isTrue !== undefined ? q.isTrue : String(q.correctAnswer).toLowerCase() === "true";
        isCorrect = submittedVal.toLowerCase() === String(expectedBool).toLowerCase();
      } else if (type === "fill_blank") {
        // Normalized case-insensitive matching for fill in the blanks
        isCorrect = submittedVal.toLowerCase() === String(q.blankAnswer || "").trim().toLowerCase();
      } else if (type === "match_pair") {
        isCorrect = submittedVal.toLowerCase() === String(q.rightItem || "").trim().toLowerCase();
      }

      const marksObtained = isCorrect ? q.marks : 0;

      if (isCorrect) {
        totalScore += marksObtained;
        correctCount++;
      } else {
        wrongCount++;
      }

      processedAnswers.push({
        questionId: q._id,
        selectedAnswer: submittedVal || "N/A",
        isCorrect,
        marksObtained,
      });
    });

    const totalMarks = quiz.totalMarks || 1;
    const percentage = Math.round((totalScore / totalMarks) * 100);

    const submission = await QuizSubmission.create({
      quizId: quiz._id,
      studentId,
      answers: processedAnswers,
      score: totalScore,
      totalMarks,
      percentage,
      startedAt: new Date(),
      submittedAt: new Date(),
      timeTaken: Number(timeTaken) || 0,
    });

    res.status(201).json({
      success: true,
      message: "Activity submitted successfully 🎉",
      data: {
        submissionId: submission._id,
        score: totalScore,
        totalMarks,
        percentage,
        correctCount,
        wrongCount,
        timeTaken: submission.timeTaken,
      },
    });
  } catch (error) {
    console.error("Error in submitQuiz:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Activity Results for Teacher / Principal
// @route   GET /api/fun-activities/quizzes/:id/results
// @access  Private (Teacher / Principal)
exports.getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId)
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Activity not found." });
    }

    if (req.user.role === "teacher" && quiz.createdBy._id.toString() !== req.user._id.toString()) {
      const teacherAssignments = await TeacherAssignment.find({
        teacherId: req.user._id,
        standardId: quiz.standardId._id,
        sectionId: quiz.sectionId._id,
      });
      if (!teacherAssignments || teacherAssignments.length === 0) {
        return res.status(403).json({ success: false, message: "Unauthorized access to results." });
      }
    }

    const stdName = quiz.standardId?.name;
    const secName = quiz.sectionId?.name;
    const studentClass = await Class.findOne({ standard: stdName, section: secName }).populate(
      "students",
      "name email studentId grNumber profilePic"
    );

    const submissions = await QuizSubmission.find({ quizId: quiz._id }).populate(
      "studentId",
      "name email studentId grNumber profilePic"
    );

    const submissionMap = {};
    submissions.forEach((sub) => {
      if (sub.studentId) {
        submissionMap[sub.studentId._id.toString()] = sub;
      }
    });

    const studentsList = studentClass && studentClass.students ? studentClass.students : [];

    const studentResults = studentsList.map((st) => {
      const sub = submissionMap[st._id.toString()];
      if (sub) {
        return {
          studentId: st._id,
          name: st.name,
          email: st.email,
          grNumber: st.grNumber || st.studentId || "-",
          status: "Completed",
          score: sub.score,
          totalMarks: sub.totalMarks,
          percentage: sub.percentage,
          submittedAt: sub.submittedAt,
          timeTaken: sub.timeTaken,
        };
      } else {
        return {
          studentId: st._id,
          name: st.name,
          email: st.email,
          grNumber: st.grNumber || st.studentId || "-",
          status: "Not Attempted",
          score: 0,
          totalMarks: quiz.totalMarks,
          percentage: 0,
          submittedAt: null,
          timeTaken: 0,
        };
      }
    });

    const participatedCount = submissions.length;
    const totalEnrolled = studentsList.length;
    const notParticipatedCount = Math.max(0, totalEnrolled - participatedCount);

    let averageScorePercentage = 0;
    if (participatedCount > 0) {
      const sumPercentage = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
      averageScorePercentage = Math.round(sumPercentage / participatedCount);
    }

    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          activityType: quiz.activityType,
          title: quiz.title,
          description: quiz.description,
          standard: stdName,
          section: secName,
          subject: quiz.subject,
          totalMarks: quiz.totalMarks,
          itemCount: quiz.questions.length,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          timeLimit: quiz.timeLimit,
          creatorName: quiz.createdBy?.name,
        },
        stats: {
          totalStudents: totalEnrolled,
          participated: participatedCount,
          notParticipated: notParticipatedCount,
          averageScore: averageScorePercentage,
        },
        studentResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Principal Fun Activities Overview & Category Analytics
// @route   GET /api/fun-activities/principal/overview
// @access  Private (Principal)
exports.getPrincipalOverview = async (req, res) => {
  try {
    const { teacherId, standardId, sectionId, subject, activityType } = req.query;

    let query = {};
    if (teacherId) query.createdBy = teacherId;
    if (standardId) query.standardId = standardId;
    if (sectionId) query.sectionId = sectionId;
    if (subject) query.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    if (activityType) query.activityType = activityType;

    const quizzes = await Quiz.find(query)
      .populate("createdBy", "name email")
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    const now = new Date();

    const categoryCounts = {
      quiz: 0,
      maths_challenge: 0,
      word_scramble: 0,
      image_challenge: 0,
      puzzle: 0,
      true_false: 0,
      fill_blank: 0,
      match_pair: 0,
    };

    let totalActivities = quizzes.length;
    let activeQuizzes = 0;
    let completedQuizzes = 0;

    const formattedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const type = quiz.activityType || "quiz";
        if (categoryCounts[type] !== undefined) {
          categoryCounts[type]++;
        }

        const isClosed = now > quiz.endDate;
        const isComingSoon = isActivityComingSoon(quiz.startDate, now);

        if (isClosed) completedQuizzes++;
        else if (!isComingSoon) activeQuizzes++;

        const submissions = await QuizSubmission.find({ quizId: quiz._id });
        const stdName = quiz.standardId?.name;
        const secName = quiz.sectionId?.name;

        let totalEnrolled = 0;
        if (stdName && secName) {
          const studentClass = await Class.findOne({ standard: stdName, section: secName });
          if (studentClass && studentClass.students) {
            totalEnrolled = studentClass.students.length;
          }
        }

        let avgScore = 0;
        if (submissions.length > 0) {
          const sumPerc = submissions.reduce((acc, s) => acc + s.percentage, 0);
          avgScore = Math.round(sumPerc / submissions.length);
        }

        return {
          id: quiz._id,
          activityType: type,
          title: quiz.title,
          teacherName: quiz.createdBy?.name || "Teacher",
          standard: stdName || "-",
          section: secName || "-",
          subject: quiz.subject,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          timeLimit: quiz.timeLimit,
          status: isClosed ? "closed" : isComingSoon ? "coming_soon" : "active",
          participatedCount: submissions.length,
          totalEnrolled,
          averageScore: avgScore,
        };
      })
    );

    const totalParticipation = await QuizSubmission.countDocuments();

    res.json({
      success: true,
      data: {
        metrics: {
          totalActivities,
          activeQuizzes,
          completedQuizzes,
          totalParticipation,
          categoryCounts,
        },
        quizzes: formattedQuizzes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Activity
// @route   DELETE /api/fun-activities/quizzes/:id
// @access  Private (Teacher creator / Principal)
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Activity not found." });
    }

    if (req.user.role === "teacher" && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this activity." });
    }

    await Quiz.findByIdAndDelete(quizId);
    await QuizSubmission.deleteMany({ quizId });

    res.json({ success: true, message: "Activity deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
