const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Get user profile
router.get('/profile', authMiddleware, userController.getUserProfile);

// Update user profile
router.put('/profile', authMiddleware, userController.updateUserProfile);

// Get user mining level
router.get('/level', authMiddleware, userController.getUserLevel);

// Get leaderboard
router.get('/leaderboard', authMiddleware, userController.getLeaderboard);

module.exports = router; 