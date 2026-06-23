const express = require('express');
const router = express.Router();
const dummyController = require('../controllers/dummyDataController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', dummyController.getAll);
router.post('/generate', dummyController.generateBulk);
router.post('/import', dummyController.importCustom);
router.delete('/all', dummyController.deleteAll);
router.delete('/batch', dummyController.deleteByBatch);
router.delete('/selected', dummyController.deleteSelected);

module.exports = router;
