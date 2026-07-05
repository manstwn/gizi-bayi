const DummyData = require('../models/DummyData');
const { Op } = require('sequelize');
const pairDataService = require('../services/pairDataService');
const nutritionalStatusService = require('../services/nutritionalStatusService');

// ─── WHO-anchor generation ────────────────────────────────────────────────────
//
// Strategy:
//   1. Pick a target class (balanced 25% each by default)
//   2. Sample a Z-score from the target class Z-range for BB/TB
//   3. Back-calculate realistic BB and TB from WHO SD tables
//   4. Run NutritionalStatusService.assess() to get the REAL label
//
// The 4-class system maps directly from BB/TB Z-score (primary WHO indicator):
//   Gizi Buruk  : zBBTB < -3
//   Gizi Kurang : -3 ≤ zBBTB < -2
//   Gizi Baik   : -2 ≤ zBBTB ≤  2
//   Gizi Lebih  : zBBTB > 2  (includes overweight, at-risk, obese)
// ─────────────────────────────────────────────────────────────────────────────

// 4 classes, equal weight for balanced dataset
const CLASS_Z_PROFILES = [
  {
    label:  'Gizi Buruk',
    zBBTB:  [-4.5, -3.01],
    zTBU:   [-3.5, -0.5],
    weight: 25,
  },
  {
    label:  'Gizi Kurang',
    zBBTB:  [-3.0, -2.01],
    zTBU:   [-2.5,  0.5],
    weight: 25,
  },
  {
    label:  'Gizi Baik',
    zBBTB:  [-2.0,  2.0],
    zTBU:   [-2.0,  2.0],
    weight: 25,
  },
  {
    label:  'Gizi Lebih',
    zBBTB:  [ 2.01, 5.0],
    zTBU:   [-0.5,  2.5],
    weight: 25,
  },
];

// Canonical 4-class names (also accepted by importCustom)
const VALID_CLASSES = CLASS_Z_PROFILES.map((p) => p.label);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
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
 * Map any category label (including old 6-class labels) to one of 4 classes.
 */
function normalizeClass(label) {
  if (!label) return 'Gizi Baik';
  if (VALID_CLASSES.includes(label)) return label;
  const l = label.toLowerCase();
  if (l.includes('buruk') || l.includes('severely')) return 'Gizi Buruk';
  if (l.includes('kurang') || l.includes('wasted'))   return 'Gizi Kurang';
  if (
    l.includes('lebih') || l.includes('overweight') ||
    l.includes('obesitas') || l.includes('berisiko')
  ) return 'Gizi Lebih';
  return 'Gizi Baik';
}

/**
 * Back-calculate a measurement from a target Z-score.
 * Mirrors NutritionalStatusService.calculateZScore() in reverse.
 *   z ≥ 0:  value = median + z × (plus1SD  − median)
 *   z < 0:  value = median + z × (median   − minus1SD)
 */
function backCalcFromZ(z, ref) {
  if (!ref) return null;
  const { median, plus1SD, minus1SD } = ref;
  const val =
    z >= 0
      ? median + z * (plus1SD - median)
      : median + z * (median - minus1SD);
  return parseFloat(val.toFixed(1));
}

// ─── Single Record Generation ─────────────────────────────────────────────────

/**
 * Generate one record anchored to WHO pair data.
 *
 * @param {string|null} targetLabel - desired 4-class label, or null for weighted random
 * @param {string}      batchLabel
 * @param {number}      maxRetries
 */
function generateOneRecord(targetLabel, batchLabel, maxRetries = 10) {
  const profile = targetLabel
    ? (CLASS_Z_PROFILES.find((p) => p.label === targetLabel) || pickWeighted(CLASS_Z_PROFILES))
    : pickWeighted(CLASS_Z_PROFILES);

  const gender = Math.random() < 0.5 ? 'L' : 'P';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 1. Random age 0–60 months
    const umur_bulan = Math.floor(Math.random() * 61);

    // 2. WHO SD references
    const refTBU  = pairDataService.getSDValues(gender, 'umur-tinggi', umur_bulan);
    if (!refTBU) continue;

    // 3. Sample Z-scores
    const zTBU  = randFloat(profile.zTBU[0],  profile.zTBU[1]);
    const zBBTB = randFloat(profile.zBBTB[0], profile.zBBTB[1]);

    // 4. Back-calculate TB
    const tb = backCalcFromZ(zTBU, refTBU);
    if (!tb || tb < 45 || tb > 130) continue;

    // 5. BB/TB reference → back-calculate BB
    const refBBTB = pairDataService.getSDValues(gender, umur_bulan < 24 ? 'panjang-berat' : 'tinggi-berat', tb);
    if (!refBBTB) continue;

    const bb = backCalcFromZ(zBBTB, refBBTB);
    if (!bb || bb < 1.5 || bb > 40) continue;

    // 6. Real assessment → canonical label
    const assessment = nutritionalStatusService.assess(bb, tb, umur_bulan, gender);
    const rawLabel   = assessment.summary.status;
    const kategori_gizi = normalizeClass(rawLabel);

    return {
      umur_bulan,
      berat_badan:   bb,
      tinggi_badan:  tb,
      jenis_kelamin: gender,
      kategori_gizi,
      label: batchLabel || 'auto-generated',
    };
  }

  // Fallback: pick a random profile and use a random Z within its range
  // (NOT the median, to keep class distribution varied)
  const fallbackProfile = pickWeighted(CLASS_Z_PROFILES);
  const umur_bulan = Math.floor(Math.random() * 61);
  const refTBU  = pairDataService.getSDValues(gender, 'umur-tinggi', umur_bulan);
  const refBBTB_check = refTBU
    ? pairDataService.getSDValues(gender, umur_bulan < 24 ? 'panjang-berat' : 'tinggi-berat', refTBU.median)
    : null;

  if (refTBU && refBBTB_check) {
    const zBBTB = randFloat(fallbackProfile.zBBTB[0], fallbackProfile.zBBTB[1]);
    const zTBU  = randFloat(fallbackProfile.zTBU[0],  fallbackProfile.zTBU[1]);
    const tb = backCalcFromZ(zTBU, refTBU) || refTBU.median;
    const refBBTB2 = pairDataService.getSDValues(gender, umur_bulan < 24 ? 'panjang-berat' : 'tinggi-berat', tb) || refBBTB_check;
    const bb = backCalcFromZ(zBBTB, refBBTB2) || refBBTB_check.median;
    const assessment = nutritionalStatusService.assess(
      Math.max(1.5, Math.min(bb, 40)),
      Math.max(45,  Math.min(tb, 130)),
      umur_bulan,
      gender
    );
    return {
      umur_bulan,
      berat_badan:  parseFloat(Math.max(1.5, Math.min(bb, 40)).toFixed(1)),
      tinggi_badan: parseFloat(Math.max(45,  Math.min(tb, 130)).toFixed(1)),
      jenis_kelamin: gender,
      kategori_gizi: normalizeClass(assessment.summary.status),
      label: batchLabel || 'auto-generated',
    };
  }

  // Ultimate fallback — generate for the Gizi Baik profile (rare edge case)
  return {
    umur_bulan: 24,
    berat_badan: 11.0,
    tinggi_badan: 85.0,
    jenis_kelamin: gender,
    kategori_gizi: 'Gizi Baik',
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
      // Custom distribution: { "Gizi Baik": 30, "Gizi Kurang": 20, ... }
      for (const [cls, num] of Object.entries(distribusi)) {
        const n = parseInt(num) || 0;
        const normalizedCls = normalizeClass(cls); // Accept both old and new class names
        for (let i = 0; i < n; i++) {
          records.push(generateOneRecord(normalizedCls, batchLabel));
        }
      }
    } else {
      // Weighted random (balanced by default — 25% each)
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
      return res.status(400).json({
        message: 'Field "records" harus berupa array dan tidak boleh kosong.',
      });
    }

    const batchLabel = batch_label || `Import ${new Date().toLocaleString('id-ID')}`;
    const toInsert = [];
    const errors   = [];

    records.forEach((r, i) => {
      const umur = parseInt(r.umur_bulan ?? r.umur);
      const bb   = parseFloat(r.berat_badan ?? r.bb);
      const tb   = parseFloat(r.tinggi_badan ?? r.tb);
      const cls  = r.kategori_gizi ?? r.kelas ?? r.label_kelas;
      const jkel = r.jenis_kelamin ?? r.jk ?? r.gender ?? 'L';

      if (isNaN(umur) || isNaN(bb) || isNaN(tb) || !cls) {
        errors.push(
          `Baris ${i + 1}: data tidak lengkap (umur_bulan, berat_badan, tinggi_badan, kategori_gizi wajib diisi)`
        );
        return;
      }

      const normalizedJk = (jkel.toUpperCase().startsWith('P') || jkel.toUpperCase().includes('PEREMPUAN')) ? 'P' : 'L';
      const normalizedCls = normalizeClass(cls);
      toInsert.push({
        umur_bulan:    umur,
        berat_badan:   bb,
        tinggi_badan:  tb,
        jenis_kelamin: normalizedJk,
        kategori_gizi: normalizedCls,
        label: batchLabel,
      });
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

    const classCounts  = {};
    const batchCounts  = {};
    records.forEach((r) => {
      const cls   = r.kategori_gizi;
      classCounts[cls]  = (classCounts[cls]  || 0) + 1;
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

// ─── Delete by Batch ──────────────────────────────────────────────────────────

exports.deleteByBatch = async (req, res) => {
  try {
    const { batch_label } = req.body;
    if (!batch_label)
      return res.status(400).json({ message: 'batch_label diperlukan.' });
    const count = await DummyData.destroy({ where: { label: batch_label } });
    res.json({
      message: `${count} data dari batch "${batch_label}" berhasil dihapus.`,
      count,
    });
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
