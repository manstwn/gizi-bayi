const express = require('express');
const router = express.Router();
const balitaController = require('../controllers/balitaController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', balitaController.getAllBalita);
router.get('/:id', balitaController.getBalitaById);
router.post('/', balitaController.createBalita);
router.put('/:id', balitaController.updateBalita);
router.delete('/:id', roleMiddleware(['admin']), balitaController.deleteBalita);

module.exports = router;
