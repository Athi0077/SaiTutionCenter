const express = require('express');
const router = express.Router();
const generalRegisterController = require('../controllers/generalRegisterController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a tuition student
router.post('/tuition-students/register', protect, generalRegisterController.registerTuitionStudent);

// Route to get students
router.get('/students', protect, generalRegisterController.getStudents);

// Route to update a student
router.put('/students/:id', protect, generalRegisterController.updateStudent);

// Route to delete a student
router.delete('/students/:id', protect, generalRegisterController.deleteStudent);

module.exports = router;
