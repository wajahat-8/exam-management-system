const express = require('express');
const { auth, roleAuth } = require('../middleware/auth');
const { 
  createNotification, 
  getSentNotifications, 
  getStudentNotifications, 
  markAsRead 
} = require('../controllers/notificationController');

const router = express.Router();

// Educator routes
router.post('/', auth, roleAuth(['educator']), createNotification);
router.get('/sent', auth, roleAuth(['educator']), getSentNotifications);

// Student routes
router.get('/student', auth, roleAuth(['student']), getStudentNotifications);
router.patch('/:id/read', auth, roleAuth(['student']), markAsRead);

module.exports = router;
