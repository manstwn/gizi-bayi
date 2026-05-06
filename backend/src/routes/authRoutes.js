const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);

// Admin only routes
router.get('/users', authMiddleware, roleMiddleware(['admin']), authController.getAllUsers);
router.put('/users/:id', authMiddleware, roleMiddleware(['admin']), authController.updateUser);
router.delete('/users/:id', authMiddleware, roleMiddleware(['admin']), authController.deleteUser);

module.exports = router;
