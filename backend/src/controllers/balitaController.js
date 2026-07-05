const Balita = require('../models/Balita');
const Pemeriksaan = require('../models/Pemeriksaan');
const { Op } = require('sequelize');

exports.getAllBalita = async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = {};
    
    if (search) {
      whereClause = {
        nama: { [Op.like]: `%${search}%` }
      };
    }

    const balita = await Balita.findAll({ where: whereClause, order: [['nama', 'ASC']] });
    res.json(balita);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBalitaById = async (req, res) => {
  try {
    const balita = await Balita.findByPk(req.params.id);
    if (!balita) return res.status(404).json({ message: 'Balita not found' });
    res.json(balita);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createBalita = async (req, res) => {
  try {
    const balita = await Balita.create(req.body);
    res.status(201).json(balita);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateBalita = async (req, res) => {
  try {
    const balita = await Balita.findByPk(req.params.id);
    if (!balita) return res.status(404).json({ message: 'Balita not found' });
    
    await balita.update(req.body);
    res.json(balita);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteBalita = async (req, res) => {
  try {
    const balita = await Balita.findByPk(req.params.id);
    if (!balita) return res.status(404).json({ message: 'Balita not found' });
    
    // Cascade delete: Delete all related pemeriksaan (checkup) records first
    await Pemeriksaan.destroy({ where: { balita_id: balita.id } });
    
    await balita.destroy();
    res.json({ message: 'Balita deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAllBalita = async (req, res) => {
  try {
    // Delete all checkups first
    await Pemeriksaan.destroy({ where: {} });
    // Then delete all balitas
    await Balita.destroy({ where: {} });
    
    // Reset SQLite sequences
    const sequelize = require('../config/database');
    await sequelize.query("DELETE FROM sqlite_sequence WHERE name IN ('Balita', 'Pemeriksaan', 'Balitas', 'Pemeriksans')");
    
    res.json({ message: 'Semua data balita dan riwayat pemeriksaan berhasil dihapus secara permanen.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

