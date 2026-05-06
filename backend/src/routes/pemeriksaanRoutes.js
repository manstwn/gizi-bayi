const express = require('express');
const router = express.Router();
const pemeriksaanController = require('../controllers/pemeriksaanController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', pemeriksaanController.createPemeriksaan);
router.get('/', pemeriksaanController.getAllPemeriksaan);
router.get('/balita/:balitaId', pemeriksaanController.getHistoryByBalita);
router.delete('/:id', roleMiddleware(['admin']), pemeriksaanController.deletePemeriksaan);

module.exports = router;
