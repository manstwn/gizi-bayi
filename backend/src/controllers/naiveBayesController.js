const Pemeriksaan = require('../models/Pemeriksaan');
const NaiveBayesModel = require('../models/NaiveBayesModel');
const DummyData = require('../models/DummyData');
const nbService = require('../services/naiveBayesService');
const nutritionalStatusService = require('../services/nutritionalStatusService');

// ─── Helper: compute Z-scores for a record ───────────────────────────────────

/**
 * Enriches a record with { z_bbu, z_tbu, z_bbtb } by calling the
 * nutritionalStatusService.  Records where Z-scores cannot be computed
 * (missing WHO reference) are dropped.
 */
function enrichWithZScores(records) {
  const enriched = [];
  for (const r of records) {
    try {
      const assessment = nutritionalStatusService.assess(
        parseFloat(r.berat_badan),
        parseFloat(r.tinggi_badan),
        parseInt(r.umur_bulan),
        r.jenis_kelamin || 'L'
      );
      enriched.push({
        ...r,
        z_bbu:  assessment.indices.bbu.z,
        z_tbu:  assessment.indices.tbu.z,
        z_bbtb: assessment.indices.bbtb.z,
      });
    } catch {
      // Skip records that fail assessment
    }
  }
  return enriched;
}

// ─── Train ────────────────────────────────────────────────────────────────────

exports.trainModel = async (req, res) => {
  try {
    const { nama_model, data_source = 'main' } = req.body;
    const { Op } = require('sequelize');
    const Balita = require('../models/Balita');

    let mainRecords  = [];
    let dummyRecords = [];

    if (data_source === 'main' || data_source === 'both') {
      const rows = await Pemeriksaan.findAll({
        attributes: ['umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi'],
        include: [{ model: Balita, as: 'balita', attributes: ['jenis_kelamin'] }],
        where: { kategori_gizi: { [Op.not]: null } },
      });
      mainRecords = rows.map((r) => ({
        umur_bulan: r.umur_bulan,
        berat_badan: r.berat_badan,
        tinggi_badan: r.tinggi_badan,
        kategori_gizi: r.kategori_gizi,
        jenis_kelamin: r.balita?.jenis_kelamin || 'L',
        _source: 'main'
      }));
    }

    if (data_source === 'dummy' || data_source === 'both') {
      const rows = await DummyData.findAll({
        attributes: ['umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi', 'jenis_kelamin'],
        raw: true,
      });
      dummyRecords = rows.map((r) => ({ ...r, _source: 'dummy' }));
    }

    const allRecords = [...mainRecords, ...dummyRecords];

    if (allRecords.length === 0) {
      return res.status(400).json({
        message: `Tidak ada data dari sumber "${data_source}". Tambahkan data pemeriksaan atau dummy terlebih dahulu.`,
      });
    }

    // Enrich with Z-scores (required by Gaussian NB)
    const enriched = enrichWithZScores(allRecords);

    if (enriched.length === 0) {
      return res.status(400).json({
        message: 'Semua record gagal dihitung Z-score-nya. Periksa data WHO pair.',
      });
    }

    // Train
    const modelData = nbService.trainModel(enriched);
    modelData.data_source  = data_source;
    modelData.mainCount    = mainRecords.length;
    modelData.dummyCount   = dummyRecords.length;

    const sourceLabel = { main: 'Data Utama', dummy: 'Dummy', both: 'Gabungan' }[data_source] || data_source;

    // Persist to DB
    const saved = await NaiveBayesModel.create({
      nama_model:   nama_model || `Model GNB (${sourceLabel}) - ${new Date().toLocaleDateString('id-ID')}`,
      model_json:   modelData,
      jumlah_data:  modelData.totalRecords,
      jumlah_kelas: modelData.activeClasses.length,
      akurasi:      modelData.accuracy,
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

// ─── List Models ──────────────────────────────────────────────────────────────

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

// ─── Get Latest Model ─────────────────────────────────────────────────────────

exports.getLatestModel = async (req, res) => {
  try {
    const model = await NaiveBayesModel.findOne({ order: [['created_at', 'DESC']] });
    if (!model)
      return res.status(404).json({
        message: 'Belum ada model yang disimpan. Latih model terlebih dahulu.',
      });
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Get Single Model ─────────────────────────────────────────────────────────

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
    const { umur_bulan, berat_badan, tinggi_badan, model_id, gender } = req.body;

    if (umur_bulan == null || berat_badan == null || tinggi_badan == null) {
      return res.status(400).json({
        message: 'umur_bulan, berat_badan, dan tinggi_badan diperlukan.',
      });
    }

    // Load model
    let savedModel;
    if (model_id) {
      savedModel = await NaiveBayesModel.findByPk(model_id);
    } else {
      savedModel = await NaiveBayesModel.findOne({ order: [['created_at', 'DESC']] });
    }
    if (!savedModel) {
      return res.status(404).json({
        message: 'Belum ada model yang tersimpan. Latih model terlebih dahulu.',
      });
    }

    // Compute Z-scores from raw inputs
    const bb   = parseFloat(berat_badan);
    const tb   = parseFloat(tinggi_badan);
    const umur = parseInt(umur_bulan);

    const assessment = nutritionalStatusService.assess(bb, tb, umur, gender);
    const z_bbu  = assessment.indices.bbu.z;
    const z_tbu  = assessment.indices.tbu.z;
    const z_bbtb = assessment.indices.bbtb.z;

    const modelData = savedModel.model_json;
    const result = nbService.predictFromModel(modelData, z_bbu, z_tbu, z_bbtb);

    res.json({
      model_id:   savedModel.id,
      model_name: savedModel.nama_model,
      input: { umur_bulan: umur, berat_badan: bb, tinggi_badan: tb },
      zscores: {
        z_bbu:  parseFloat(z_bbu.toFixed(3)),
        z_tbu:  parseFloat(z_tbu.toFixed(3)),
        z_bbtb: parseFloat(z_bbtb.toFixed(3)),
      },
      who_assessment: assessment,
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
    const { Op }   = require('sequelize');
    const Balita   = require('../models/Balita');

    const records = await Pemeriksaan.findAll({
      attributes: ['id', 'umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi', 'tanggal_pemeriksaan'],
      include: [{ model: Balita, as: 'balita', attributes: ['nama', 'jenis_kelamin'] }],
      where: { kategori_gizi: { [Op.not]: null } },
      order: [['tanggal_pemeriksaan', 'DESC']],
      limit: 200,
    });

    const dummyCount = await DummyData.count();
    const dummyRows = await DummyData.findAll({
      attributes: ['id', 'umur_bulan', 'berat_badan', 'tinggi_badan', 'kategori_gizi', 'jenis_kelamin', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    // Include Z-scores in preview
    const preview = records.map((r) => {
      let zscores = null;
      try {
        const assessment = nutritionalStatusService.assess(
          r.berat_badan,
          r.tinggi_badan,
          r.umur_bulan,
          r.balita?.jenis_kelamin || 'L'
        );
        zscores = {
          z_bbu:  parseFloat(assessment.indices.bbu.z.toFixed(3)),
          z_tbu:  parseFloat(assessment.indices.tbu.z.toFixed(3)),
          z_bbtb: parseFloat(assessment.indices.bbtb.z.toFixed(3)),
        };
      } catch {
        zscores = null;
      }

      return {
        id:                   r.id,
        nama:                 r.balita?.nama,
        umur_bulan:           r.umur_bulan,
        berat_badan:          r.berat_badan,
        tinggi_badan:         r.tinggi_badan,
        kategori_gizi:        r.kategori_gizi,
        jenis_kelamin:        r.balita?.jenis_kelamin || 'L',
        tanggal_pemeriksaan:  r.tanggal_pemeriksaan,
        zscores,
        status_data:          'Utama',
      };
    });

    const dummyPreview = dummyRows.map((r) => {
      let zscores = null;
      try {
        const assessment = nutritionalStatusService.assess(
          r.berat_badan,
          r.tinggi_badan,
          r.umur_bulan,
          r.jenis_kelamin || 'L'
        );
        zscores = {
          z_bbu:  parseFloat(assessment.indices.bbu.z.toFixed(3)),
          z_tbu:  parseFloat(assessment.indices.tbu.z.toFixed(3)),
          z_bbtb: parseFloat(assessment.indices.bbtb.z.toFixed(3)),
        };
      } catch {
        zscores = null;
      }

      return {
        id:             r.id,
        nama:           `Dummy #${r.id}`,
        umur_bulan:     r.umur_bulan,
        berat_badan:    r.berat_badan,
        tinggi_badan:   r.tinggi_badan,
        kategori_gizi:  r.kategori_gizi,
        jenis_kelamin:  r.jenis_kelamin || 'L',
        zscores,
        status_data:    'Dummy',
      };
    });

    res.json({ total: records.length, dummyTotal: dummyCount, records: preview, dummyRecords: dummyPreview });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
