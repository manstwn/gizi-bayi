const DummyData = require('../models/DummyData');
const { Op } = require('sequelize');
const pairDataService = require('../services/pairDataService');
const nutritionalStatusService = require('../services/nutritionalStatusService');

// ─── WHO-anchor generation ────────────────────────────────────────────────────
//
// Instead of hardcoded ranges, we:
//   1. Pick a random umur_bulan (0–60)
//   2. Fetch real WHO SD anchors for that age from pairDataService
//   3. Sample a Z-score from a desired range to get a realistic bb/tb
//   4. Run NutritionalStatusService.assess() to get the REAL kategori_gizi label
//
// This guarantees every generated record is internally consistent with the
// same Z-score logic used in production.

// Z-score sampling ranges per desired nutritional class (BB/TB index drives primary class)
const CLASS_Z_PROFILES = [
  { label: 'Gizi Buruk (Severely Wasted)',  zBBTB: [-4.5, -3.01], zBBU: [-4.5, -3.01], zTBU: [-3.5, -0.5], weight: 10 },
  { label: 'Gizi Kurang (Wasted)',           zBBTB: [-3.0, -2.01], zBBU: [-2.5, -1.0],  zTBU: [-2.5, 0.0],  weight: 20 },
  { label: 'Gizi Baik (Normal)',             zBBTB: [-2.0,  1.0],  zBBU: [-1.5, 1.0],   zTBU: [-1.5, 1.5],  weight: 50 },
  { label: 'Berisiko Gizi Lebih',            zBBTB: [ 1.01, 2.0],  zBBU: [0.5,  1.5],   zTBU: [-0.5, 1.5],  weight: 10 },
  { label: 'Gizi Lebih (Overweight)',        zBBTB: [ 2.01, 3.0],  zBBU: [1.0,  2.0],   zTBU: [-0.5, 2.0],  weight: 7  },
  { label: 'Obesitas',                       zBBTB: [ 3.01, 5.0],  zBBU: [1.5,  3.0],   zTBU: [ 0.0, 2.5],  weight: 3  },
];

function randFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function pickWeighted(profiles) {
  const total = profiles.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of profiles) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return profiles[profiles.length - 1];
}

/**
 * Back-calculate a measurement from a target Z-score and SD reference values.
 * Uses the same signed-SD formula as NutritionalStatusService.calculateZScore():
 *   if z >= 0:  value = median + z * (plus1SD - median)
 *   if z < 0:   value = median + z * (median - minus1SD)
 */
function backCalcFromZ(z, ref) {
  if (!ref) return null;
  const { median, plus1SD, minus1SD } = ref;
  let val;
  if (z >= 0) {
    val = median + z * (plus1SD - median);
  } else {
    val = median + z * (median - minus1SD);
  }
  return parseFloat(val.toFixed(1));
}

/**
 * Generate one record anchored to WHO pair data.
 * @param {string|null} targetLabel - desired class, or null for weighted random
 * @param {string} batchLabel
 * @param {number} maxRetries - retry if assess() gives a different class than intended
 */
function generateOneRecord(targetLabel, batchLabel, maxRetries = 8) {
  const profile = targetLabel
    ? (CLASS_Z_PROFILES.find(p => p.label === targetLabel) || pickWeighted(CLASS_Z_PROFILES))
    : pickWeighted(CLASS_Z_PROFILES);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 1. Random age
    const umur_bulan = Math.floor(Math.random() * 61); // 0-60

    // 2. Get WHO SD references
    const refBBU  = pairDataService.getSDValues('umur-berat', umur_bulan);
    const refTBU  = pairDataService.getSDValues('umur-tinggi', umur_bulan);

    if (!refBBU || !refTBU) continue;

    // 3. Sample Z-scores within the target ranges
    const zTBU  = randFloat(profile.zTBU[0],  profile.zTBU[1]);
    const zBBTB = randFloat(profile.zBBTB[0], profile.zBBTB[1]);

    // 4. Back-calculate TB from umur-tinggi reference
    const tb = backCalcFromZ(zTBU, refTBU);
    if (!tb || tb < 45 || tb > 130) continue;

    // 5. Get BB/TB reference for this height, back-calculate BB
    const refBBTB = pairDataService.getSDValues('panjang-berat', tb);
    if (!refBBTB) continue;

    const bb = backCalcFromZ(zBBTB, refBBTB);
    if (!bb || bb < 1.5 || bb > 35) continue;

    // 6. Run through real assessment to get the actual label
    const assessment = nutritionalStatusService.assess(bb, tb, umur_bulan);
    const kategori_gizi = assessment.summary.status;

    return {
      umur_bulan,
      berat_badan: bb,
      tinggi_badan: tb,
      kategori_gizi,
      label: batchLabel || 'auto-generated',
    };
  }

  // Fallback: pure random age, target Normal class
  const umur_bulan = Math.floor(Math.random() * 61);
  const refBBU  = pairDataService.getSDValues('umur-berat', umur_bulan);
  const refTBU  = pairDataService.getSDValues('umur-tinggi', umur_bulan);
  const tb = refTBU ? parseFloat(refTBU.median.toFixed(1)) : 75;
  const bb = refBBU ? parseFloat(refBBU.median.toFixed(1)) : 10;
  const assessment = nutritionalStatusService.assess(bb, tb, umur_bulan);
  return {
    umur_bulan,
    berat_badan: bb,
    tinggi_badan: tb,
    kategori_gizi: assessment.summary.status,
    label: batchLabel || 'auto-generated',
  };
}

// ─── Generate Bulk ────────────────────────────────────────────────────────────

exports.generateBulk = async (req, res) => {
  try {
    const { jumlah = 50, distribusi = null, batch_label = null } = req.body;
    const count = Math.min(parseInt(jumlah) || 50, 1000);
    const batchLabel = batch_label || `Batch ${new Date().toLocaleString('id-ID')}`;

    const records = [];

    if (distribusi && typeof distribusi === 'object') {
      // Custom distribution: { "Gizi Baik (Normal)": 30, "Gizi Kurang (Wasted)": 20, ... }
      for (const [cls, num] of Object.entries(distribusi)) {
        const n = parseInt(num) || 0;
        for (let i = 0; i < n; i++) {
          records.push(generateOneRecord(cls, batchLabel));
        }
      }
    } else {
      // Weighted random
      for (let i = 0; i < count; i++) {
        records.push(generateOneRecord(null, batchLabel));
      }
    }

    // Shuffle
    records.sort(() => Math.random() - 0.5);

    const created = await DummyData.bulkCreate(records);
    res.status(201).json({
      message: `${created.length} data dummy berhasil dibuat.`,
      count: created.length,
      batch_label: batchLabel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat data dummy.', error: error.message });
  }
};

// ─── Import Custom (JSON/CSV rows) ───────────────────────────────────────────

exports.importCustom = async (req, res) => {
  try {
    const { records, batch_label } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Field "records" harus berupa array dan tidak boleh kosong.' });
    }

    const batchLabel = batch_label || `Import ${new Date().toLocaleString('id-ID')}`;
    const validClasses = [
      'Gizi Buruk (Severely Wasted)', 'Gizi Kurang (Wasted)', 'Gizi Baik (Normal)',
      'Berisiko Gizi Lebih', 'Gizi Lebih (Overweight)', 'Obesitas',
    ];

    const toInsert = [];
    const errors = [];

    records.forEach((r, i) => {
      const umur = parseInt(r.umur_bulan ?? r.umur);
      const bb = parseFloat(r.berat_badan ?? r.bb);
      const tb = parseFloat(r.tinggi_badan ?? r.tb);
      const cls = r.kategori_gizi ?? r.kelas ?? r.label_kelas;

      if (isNaN(umur) || isNaN(bb) || isNaN(tb) || !cls) {
        errors.push(`Baris ${i + 1}: data tidak lengkap (umur_bulan, berat_badan, tinggi_badan, kategori_gizi wajib diisi)`);
        return;
      }
      if (!validClasses.includes(cls)) {
        errors.push(`Baris ${i + 1}: kategori_gizi "${cls}" tidak valid`);
        return;
      }
      toInsert.push({ umur_bulan: umur, berat_badan: bb, tinggi_badan: tb, kategori_gizi: cls, label: batchLabel });
    });

    const created = await DummyData.bulkCreate(toInsert);
    res.status(201).json({
      message: `${created.length} data berhasil diimport.`,
      count: created.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengimport data.', error: error.message });
  }
};

// ─── Get All ──────────────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const { limit = 500 } = req.query;
    const records = await DummyData.findAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
    });

    // Count by class
    const classCounts = {};
    const batchCounts = {};
    records.forEach(r => {
      const cls = r.kategori_gizi;
      classCounts[cls] = (classCounts[cls] || 0) + 1;
      const batch = r.label;
      batchCounts[batch] = (batchCounts[batch] || 0) + 1;
    });

    res.json({ total: records.length, classCounts, batchCounts, records });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Delete Selected ──────────────────────────────────────────────────────────

exports.deleteSelected = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids harus berupa array ID.' });
    }
    const count = await DummyData.destroy({ where: { id: { [Op.in]: ids } } });
    res.json({ message: `${count} data berhasil dihapus.`, count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Delete by Batch ─────────────────────────────────────────────────────────

exports.deleteByBatch = async (req, res) => {
  try {
    const { batch_label } = req.body;
    if (!batch_label) return res.status(400).json({ message: 'batch_label diperlukan.' });
    const count = await DummyData.destroy({ where: { label: batch_label } });
    res.json({ message: `${count} data dari batch "${batch_label}" berhasil dihapus.`, count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Delete All ───────────────────────────────────────────────────────────────

exports.deleteAll = async (req, res) => {
  try {
    const count = await DummyData.destroy({ where: {} });
    res.json({ message: `Semua ${count} data dummy berhasil dihapus.`, count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
