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

    // Fetch global setting
    const Setting = require('../models/Setting');
    const setting = await Setting.findOne({ where: { key: 'app_settings' } });
    
    let resolvedMetode = metode;
    let resolvedModelId = model_id;
    
    // Non-admins (kader) must use the globally configured setting
    if (req.user?.role !== 'admin') {
      if (setting && setting.value) {
        const mode = setting.value.calculation_mode || 'WHO';
        if (mode === 'WHO') {
          resolvedMetode = 'WHO';
          resolvedModelId = null;
        } else if (mode === 'NB_LATEST') {
          resolvedMetode = 'Naive Bayes';
          resolvedModelId = null;
        } else if (mode === 'NB_SPECIFIC') {
          resolvedMetode = 'Naive Bayes';
          resolvedModelId = setting.value.selected_model_id || null;
        }
      } else {
        resolvedMetode = 'WHO';
        resolvedModelId = null;
      }
    }

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
    if (resolvedMetode === 'Naive Bayes') {
      let savedModel;
      if (resolvedModelId) {
        savedModel = await NaiveBayesModel.findByPk(resolvedModelId);
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
      
      const bbuMap = {
        'Berat badan sangat kurang': 'Sangat Kurang',
        'Berat badan kurang': 'Kurang',
        'Berat badan normal': 'Normal',
        'Risiko berat badan lebih': 'Badan Lebih'
      };
      const tbuMap = {
        'Sangat pendek': 'Sangat Pendek',
        'Pendek': 'Pendek',
        'Normal': 'Normal',
        'Tinggi': 'Tinggi'
      };
      const bbtbMap = {
        'Gizi buruk': 'Gizi Buruk',
        'Gizi kurang': 'Gizi Kurang',
        'Gizi baik': 'Normal',
        'Gizi lebih': 'Gizi Lebih'
      };

      const bbuCategory = bbuMap[assessment.indices.bbu.category] || assessment.indices.bbu.category;
      const tbuCategory = tbuMap[assessment.indices.tbu.category] || assessment.indices.tbu.category;
      const bbtbCategory = bbtbMap[assessment.indices.bbtb.category] || assessment.indices.bbtb.category;

      prediction = nbService.predictFromModel(modelData, bbuCategory, tbuCategory, bbtbCategory);
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
      metode: resolvedMetode,
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
      include: [{ model: Balita, as: 'balita', attributes: ['nama', 'jenis_kelamin'] }],
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
