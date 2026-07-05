const Pemeriksaan = require('../models/Pemeriksaan');
const Balita = require('../models/Balita');
const NutritionalStatusService = require('../services/nutritionalStatusService');
const NaiveBayesModel = require('../models/NaiveBayesModel');
const nbService = require('../services/naiveBayesService');

exports.createPemeriksaan = async (req, res) => {
  try {
    const { balita_id, berat_badan, tinggi_badan, umur_bulan, tanggal_pemeriksaan, catatan, metode = 'WHO', model_id } = req.body;
    
    // Validate balita existence
    const balita = await Balita.findByPk(balita_id);
    if (!balita) return res.status(404).json({ message: 'Balita not found' });

    // 1. Always calculate Z-Score Assessment using WHO Z-Score logic
    const assessment = NutritionalStatusService.assess(
      parseFloat(berat_badan), 
      parseFloat(tinggi_badan), 
      parseFloat(umur_bulan),
      balita.jenis_kelamin
    );

    let finalKategori = assessment.summary.status;
    let finalHasilFuzzy = assessment.indices.bbtb.z; // default WHO Z-score
    let finalModelId = null;
    let prediction = null;

    // 2. If Naive Bayes classification is selected
    if (metode === 'Naive Bayes') {
      let savedModel;
      if (model_id) {
        savedModel = await NaiveBayesModel.findByPk(model_id);
      } else {
        // Fallback to latest trained model
        savedModel = await NaiveBayesModel.findOne({ order: [['created_at', 'DESC']] });
      }

      if (!savedModel) {
        return res.status(400).json({ 
          message: 'Belum ada model Naive Bayes yang disimpan. Silakan latih model terlebih dahulu.' 
        });
      }

      finalModelId = savedModel.id;
      const modelData = savedModel.model_json;
      
      const z_bbu = assessment.indices.bbu.z;
      const z_tbu = assessment.indices.tbu.z;
      const z_bbtb = assessment.indices.bbtb.z;

      prediction = nbService.predictFromModel(modelData, z_bbu, z_tbu, z_bbtb);
      finalKategori = prediction.predicted_class;
      finalHasilFuzzy = prediction.confidence; // Store confidence percentage (0-100)
    }

    const pemeriksaan = await Pemeriksaan.create({
      balita_id,
      berat_badan,
      tinggi_badan,
      umur_bulan,
      tanggal_pemeriksaan: tanggal_pemeriksaan || new Date(),
      hasil_fuzzy: finalHasilFuzzy,
      kategori_gizi: finalKategori,
      petugas_id: req.user.id,
      catatan,
      metode,
      model_id: finalModelId
    });

    res.status(201).json({
      message: 'Pemeriksaan saved successfully',
      data: pemeriksaan,
      assessment: assessment,
      prediction: prediction
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
