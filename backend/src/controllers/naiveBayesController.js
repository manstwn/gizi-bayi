const Pemeriksaan = require('../models/Pemeriksaan');
const NaiveBayesModel = require('../models/NaiveBayesModel');
const DummyData = require('../models/DummyData');
const nbService = require('../services/naiveBayesService');

// ─── Train ────────────────────────────────────────────────────────────────────

exports.trainModel = async (req, res) => {
  try {
    const { nama_model, data_source = 'main' } = req.body;
    // data_source: 'main' | 'dummy' | 'both'

    const { Op } = require('sequelize');
    let mainRecords = [];
    let dummyRecords = [];

    if (data_source === 'main' || data_source === 'both') {
      const rows = await Pemeriksaan.findAll({
        attributes: ['umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi'],
        where: { kategori_gizi: { [Op.not]: null } },
        raw: true,
      });
      mainRecords = rows.map(r => ({ ...r, _source: 'main' }));
    }

    if (data_source === 'dummy' || data_source === 'both') {
      const rows = await DummyData.findAll({
        attributes: ['umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi'],
        raw: true,
      });
      dummyRecords = rows.map(r => ({ ...r, _source: 'dummy' }));
    }

    const allRecords = [...mainRecords, ...dummyRecords];

    if (allRecords.length === 0) {
      return res.status(400).json({
        message: `Tidak ada data dari sumber "${data_source}". Tambahkan data pemeriksaan atau dummy terlebih dahulu.`,
      });
    }

    // Train the model
    const modelData = nbService.trainModel(allRecords);
    modelData.data_source = data_source;
    modelData.mainCount = mainRecords.length;
    modelData.dummyCount = dummyRecords.length;

    const sourceLabel = { main: 'Data Utama', dummy: 'Dummy', both: 'Gabungan' }[data_source] || data_source;

    // Persist to DB
    const saved = await NaiveBayesModel.create({
      nama_model: nama_model || `Model NB (${sourceLabel}) - ${new Date().toLocaleDateString('id-ID')}`,
      model_json: modelData,
      jumlah_data: modelData.totalRecords,
      jumlah_kelas: modelData.activeClasses.length,
      akurasi: modelData.accuracy,
    });

    res.status(201).json({
      message: 'Model berhasil dilatih dan disimpan.',
      model_id: saved.id,
      model: modelData,
    });
  } catch (error) {
    console.error('Train error:', error);
    res.status(500).json({ message: 'Gagal melatih model.', error: error.message });
  }
};

// ─── List Models ─────────────────────────────────────────────────────────────

exports.getModels = async (req, res) => {
  try {
    const models = await NaiveBayesModel.findAll({
      attributes: ['id', 'nama_model', 'jumlah_data', 'jumlah_kelas', 'akurasi', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get Latest Model ────────────────────────────────────────────────────────

exports.getLatestModel = async (req, res) => {
  try {
    const model = await NaiveBayesModel.findOne({
      order: [['created_at', 'DESC']],
    });
    if (!model) return res.status(404).json({ message: 'Belum ada model yang disimpan. Latih model terlebih dahulu.' });
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get Single Model ────────────────────────────────────────────────────────

exports.getModelById = async (req, res) => {
  try {
    const model = await NaiveBayesModel.findByPk(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model tidak ditemukan.' });
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Predict ─────────────────────────────────────────────────────────────────

exports.predict = async (req, res) => {
  try {
    const { umur_bulan, berat_badan, tinggi_badan, model_id } = req.body;

    if (umur_bulan == null || berat_badan == null || tinggi_badan == null) {
      return res.status(400).json({ message: 'umur_bulan, berat_badan, dan tinggi_badan diperlukan.' });
    }

    // Load model
    let savedModel;
    if (model_id) {
      savedModel = await NaiveBayesModel.findByPk(model_id);
    } else {
      savedModel = await NaiveBayesModel.findOne({ order: [['created_at', 'DESC']] });
    }
    if (!savedModel) {
      return res.status(404).json({ message: 'Belum ada model yang tersimpan. Latih model terlebih dahulu.' });
    }

    const modelData = savedModel.model_json;
    const result = nbService.predictFromModel(modelData, parseFloat(umur_bulan), parseFloat(berat_badan), parseFloat(tinggi_badan));

    res.json({
      model_id: savedModel.id,
      model_name: savedModel.nama_model,
      input: { umur_bulan, berat_badan, tinggi_badan },
      ...result,
    });
  } catch (error) {
    console.error('Predict error:', error);
    res.status(500).json({ message: 'Gagal melakukan prediksi.', error: error.message });
  }
};

// ─── Delete Model ─────────────────────────────────────────────────────────────

exports.deleteModel = async (req, res) => {
  try {
    const model = await NaiveBayesModel.findByPk(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model tidak ditemukan.' });
    await model.destroy();
    res.json({ message: 'Model berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get Training Data Preview ────────────────────────────────────────────────

exports.getTrainingData = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const Balita = require('../models/Balita');

    const records = await Pemeriksaan.findAll({
      attributes: ['id', 'umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi', 'tanggal_pemeriksaan'],
      include: [{ model: Balita, as: 'balita', attributes: ['nama'] }],
      where: { kategori_gizi: { [Op.not]: null } },
      order: [['tanggal_pemeriksaan', 'DESC']],
      limit: 200,
    });

    const dummyCount = await DummyData.count();

    // Binned preview
    const binned = records.map(r => ({
      id: r.id,
      nama: r.balita?.nama,
      umur_bulan: r.umur_bulan,
      berat_badan: r.berat_badan,
      tinggi_badan: r.tinggi_badan,
      kategori_gizi: r.kategori_gizi,
      tanggal_pemeriksaan: r.tanggal_pemeriksaan,
      binned: nbService.binRecord(r),
    }));

    res.json({ total: records.length, dummyTotal: dummyCount, records: binned });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
