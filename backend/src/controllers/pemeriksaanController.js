const Pemeriksaan = require('../models/Pemeriksaan');
const Balita = require('../models/Balita');
const Setting = require('../models/Setting');
const FuzzyService = require('../services/fuzzyService');

exports.createPemeriksaan = async (req, res) => {
  try {
    const { balita_id, berat_badan, tinggi_badan, umur_bulan, tanggal_pemeriksaan, catatan } = req.body;
    
    // Validate balita existence
    const balita = await Balita.findByPk(balita_id);
    if (!balita) return res.status(404).json({ message: 'Balita not found' });

    // Fetch Fuzzy Settings from DB
    const setting = await Setting.findOne({ where: { key: 'fuzzy_parameters' } });
    const customParams = setting ? setting.value : null;

    // Calculate Fuzzy Status
    const fuzzyResult = FuzzyService.calculate(berat_badan, tinggi_badan, umur_bulan, customParams);

    const pemeriksaan = await Pemeriksaan.create({
      balita_id,
      berat_badan,
      tinggi_badan,
      umur_bulan,
      tanggal_pemeriksaan: tanggal_pemeriksaan || new Date(),
      hasil_fuzzy: fuzzyResult.value,
      kategori_gizi: fuzzyResult.category,
      petugas_id: req.user.id,
      catatan
    });

    res.status(201).json({
      message: 'Pemeriksaan saved successfully',
      data: pemeriksaan,
      fuzzy_details: fuzzyResult.details
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating pemeriksaan', error: error.message });
  }
};

exports.getHistoryByBalita = async (req, res) => {
  try {
    const history = await Pemeriksaan.findAll({
      where: { balita_id: req.params.balitaId },
      order: [['tanggal_pemeriksaan', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllPemeriksaan = async (req, res) => {
  try {
    const pemeriksaan = await Pemeriksaan.findAll({
      include: [{ model: Balita, as: 'balita', attributes: ['nama'] }],
      order: [['tanggal_pemeriksaan', 'DESC']]
    });
    res.json(pemeriksaan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deletePemeriksaan = async (req, res) => {
  try {
    const pemeriksaan = await Pemeriksaan.findByPk(req.params.id);
    if (!pemeriksaan) return res.status(404).json({ message: 'Pemeriksaan not found' });
    
    await pemeriksaan.destroy();
    res.json({ message: 'Pemeriksaan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
