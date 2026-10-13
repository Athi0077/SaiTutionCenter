const express = require("express");
const router = express.Router();
const {
  createTodo,
  getMyTodos,
  getCreatedTodos,
  updateTodoStatus,
  updateTodo,
  deleteTodo
} = require("../controllers/todoController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.post("/", createTodo);
router.get("/my", getMyTodos);
router.get("/created", getCreatedTodos);
router.patch("/:id/status", updateTodoStatus);
router.put("/:id", updateTodo);
router.delete("/:id", deleteTodo);

module.exports = router;
