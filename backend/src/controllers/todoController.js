const Todo = require("../models/Todo");
const Class = require("../models/Class");
const User = require("../models/User");
const { getIo } = require("../utils/socket");

// @desc    Create a new Todo / Assignment
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      assignedAt,
      dueDate,
      attachment,
      taskType, // PRINCIPAL_TO_TEACHER, TEACHER_TO_STUDENT, STUDENT_PERSONAL
      assignees, // Array of User IDs
      classId,
      subjectId
    } = req.body;

    const todoData = {
      title,
      description,
      taskType,
      createdBy: req.user._id,
      priority,
      assignedAt,
      dueDate,
      attachment,
      classId,
      subjectId,
      assignments: []
    };

    // Role-based validation and assignment creation
    if (taskType === "PRINCIPAL_TO_TEACHER") {
      if (req.user.role !== "principal") {
        return res.status(403).json({ success: false, message: "Only principals can assign to teachers" });
      }
      if (assignees && assignees.length > 0) {
        todoData.assignments = assignees.map(id => ({ assignee: id }));
      }
    } else if (taskType === "TEACHER_TO_STUDENT") {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Only teachers can assign to students" });
      }
      if (!classId) {
        return res.status(400).json({ success: false, message: "Class is required for student assignments" });
      }

      // Verify the teacher has access to this class
      const cls = await Class.findById(classId);
      if (!cls) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      
      let targetStudents = assignees || [];
      if (targetStudents.length === 0) {
        // Assign to all students in the class
        if (cls.students) {
          targetStudents = cls.students;
        }
      }
      
      todoData.assignments = targetStudents.map(id => ({ assignee: id }));
    } else if (taskType === "STUDENT_PERSONAL") {
      if (req.user.role !== "student") {
        return res.status(403).json({ success: false, message: "Only students can create personal todos" });
      }
      // Add a self-assignment so status tracking is unified
      todoData.assignments = [{ assignee: req.user._id }];
    } else {
      return res.status(400).json({ success: false, message: "Invalid taskType" });
    }

    const todo = await Todo.create(todoData);

    try {
      const io = getIo();
      if (todoData.assignments.length > 0) {
        todoData.assignments.forEach(a => {
          io.to(`user:${a.assignee}`).emit('new_todo', { message: `New task assigned: ${title}`, todo });
        });
      }
    } catch (e) {
      console.log('Socket error', e);
    }

    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Todos assigned to me (or my personal)
// @route   GET /api/todos/my
// @access  Private
const getMyTodos = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find todos where this user is an assignee
    const todos = await Todo.find({
      "assignments.assignee": userId
    })
    .populate("createdBy", "name role")
    .populate("classId", "className section")
    .populate("subjectId", "name")
    .sort({ dueDate: 1, createdAt: -1 });

    // Format the response so the user gets their specific assignment details at the top level
    const formattedTodos = todos.map(todo => {
      const obj = todo.toObject();
      const myAssignment = obj.assignments.find(a => String(a.assignee) === String(userId));
      obj.myAssignment = myAssignment; // Attach the specific assignment object
      delete obj.assignments; // Hide other students' assignments for privacy
      return obj;
    });

    res.json({ success: true, data: formattedTodos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Todos created by me (to track progress)
// @route   GET /api/todos/created
// @access  Private
const getCreatedTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ createdBy: req.user._id })
      .populate("assignments.assignee", "name email")
      .populate("classId", "className section")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update my assignment status
// @route   PATCH /api/todos/:id/status
// @access  Private
const updateTodoStatus = async (req, res) => {
  try {
    const { status, completionRemarks, submissionAttachment } = req.body;
    const userId = req.user._id;

    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ success: false, message: "Todo not found" });
    }

    const assignmentIndex = todo.assignments.findIndex(a => String(a.assignee) === String(userId));
    if (assignmentIndex === -1) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    todo.assignments[assignmentIndex].status = status;
    todo.assignments[assignmentIndex].completionRemarks = completionRemarks || todo.assignments[assignmentIndex].completionRemarks;
    todo.assignments[assignmentIndex].submissionAttachment = submissionAttachment || todo.assignments[assignmentIndex].submissionAttachment;
    
    if (status === "Completed") {
      todo.assignments[assignmentIndex].completedAt = new Date();
    } else {
      todo.assignments[assignmentIndex].completedAt = null;
    }

    await todo.save();

    try {
      const io = getIo();
      io.to(`user:${todo.createdBy}`).emit('todo_status_updated', { 
        message: `${req.user.name} updated task status to ${status}`, 
        todoId: todo._id,
        userId: req.user._id,
        status 
      });
    } catch (e) {
      console.log('Socket error', e);
    }

    res.json({ success: true, message: "Status updated", data: todo.assignments[assignmentIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Todo details (creator only)
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    const { title, description, priority, dueDate, attachment } = req.body;
    
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: "Todo not found" });

    if (String(todo.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this task" });
    }

    if (title) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (priority) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (attachment !== undefined) todo.attachment = attachment;

    await todo.save();
    res.json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: "Todo not found" });

    if (String(todo.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this task" });
    }

    await Todo.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTodo,
  getMyTodos,
  getCreatedTodos,
  updateTodoStatus,
  updateTodo,
  deleteTodo
};
