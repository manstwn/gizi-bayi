const express = require('express');
const router = express.Router();
const nbController = require('../controllers/naiveBayesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/train', nbController.trainModel);
router.get('/models', nbController.getModels);
router.get('/models/latest', nbController.getLatestModel);
router.get('/models/:id', nbController.getModelById);
router.post('/predict', nbController.predict);
router.delete('/models/:id', nbController.deleteModel);
router.get('/training-data', nbController.getTrainingData);

module.exports = router;
