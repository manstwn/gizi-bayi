const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/fuzzy', authMiddleware, settingController.getFuzzyParameters);
router.post('/fuzzy', authMiddleware, roleMiddleware(['admin', 'kader']), settingController.updateFuzzyParameters);
router.post('/simulate', authMiddleware, settingController.simulateCalculation);
router.get('/pairs', authMiddleware, settingController.getPairData);

module.exports = router;
