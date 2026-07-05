/**
 * Gaussian Naive Bayes Service
 *
 * Uses WHO Z-score features (BB/U, TB/U, BB/TB) for nutritional status
 * classification. 4 canonical output classes. Includes stratified 80/20
 * train-test split and full evaluation metrics (confusion matrix, precision,
 * recall, F1).
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ['Gizi Buruk', 'Gizi Kurang', 'Gizi Baik', 'Gizi Lebih'];

const FEATURE_KEYS = ['z_bbu', 'z_tbu', 'z_bbtb'];

const FEATURE_LABELS = {
  z_bbu:  'Z-score BB/U (Berat Badan per Umur)',
  z_tbu:  'Z-score TB/U (Tinggi Badan per Umur)',
  z_bbtb: 'Z-score BB/TB atau BB/PB (Berat Badan menurut Tinggi/Panjang)',
};

// ─── Class Normalisation ─────────────────────────────────────────────────────

/**
 * Map any label (including old 6-class labels) to one of 4 canonical classes.
 */
function normalizeClass(label) {
  if (!label) return 'Gizi Baik';
  if (CLASSES.includes(label)) return label;
  const l = label.toLowerCase();
  if (l.includes('buruk') || l.includes('severely')) return 'Gizi Buruk';
  if (l.includes('kurang') || l.includes('wasted'))   return 'Gizi Kurang';
  if (
    l.includes('lebih') || l.includes('overweight') ||
    l.includes('obesitas') || l.includes('berisiko')
  ) return 'Gizi Lebih';
  return 'Gizi Baik';
}

// ─── Statistics Helpers ───────────────────────────────────────────────────────

/**
 * Compute mean and variance of a numeric array.
 * Returns { mean, variance }.  variance floored at 1e-6 to prevent /0.
 */
function meanVariance(arr) {
  const n = arr.length;
  if (n === 0) return { mean: 0, variance: 1 };
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = Math.max(
    arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n,
    1e-6
  );
  return { mean, variance };
}

/**
 * Gaussian probability density function.
 * P(x | μ, σ²) = 1/√(2πσ²) · exp(-(x-μ)²/(2σ²))
 */
function gaussianPDF(x, mean, variance) {
  const v = variance || 1e-6;
  return (
    (1 / Math.sqrt(2 * Math.PI * v)) *
    Math.exp(-((x - mean) ** 2) / (2 * v))
  );
}

// ─── Stratified Split ─────────────────────────────────────────────────────────

/**
 * Stratified train-test split.  Ensures every class is represented in both sets.
 * @param {Array}  records   - objects with { kategori_gizi, ... }
 * @param {number} testRatio - fraction for test set (default 0.2)
 */
function stratifiedSplit(records, testRatio = 0.2) {
  const byClass = {};
  records.forEach((r) => {
    const cls = r.kategori_gizi;
    if (!byClass[cls]) byClass[cls] = [];
    byClass[cls].push(r);
  });

  const train = [];
  const test  = [];

  Object.values(byClass).forEach((classRecords) => {
    const shuffled = [...classRecords].sort(() => Math.random() - 0.5);
    // Guarantee at least 1 sample in test for any class that has ≥ 2 samples
    const nTest = classRecords.length >= 2
      ? Math.max(1, Math.round(shuffled.length * testRatio))
      : 0;
    test.push(...shuffled.slice(0, nTest));
    train.push(...shuffled.slice(nTest));
  });

  return { train, test };
}

// ─── Evaluation Metrics ───────────────────────────────────────────────────────

/**
 * Compute confusion matrix + per-class precision, recall, F1.
 * @param {string[]} predictions
 * @param {string[]} actuals
 * @param {string[]} classes
 */
function computeMetrics(predictions, actuals, classes) {
  // matrix[actual][predicted] = count
  const matrix = {};
  classes.forEach((a) => {
    matrix[a] = {};
    classes.forEach((p) => { matrix[a][p] = 0; });
  });

  predictions.forEach((pred, i) => {
    const actual = actuals[i];
    if (matrix[actual] && matrix[actual][pred] !== undefined) {
      matrix[actual][pred]++;
    }
  });

  const perClass = {};
  classes.forEach((cls) => {
    const TP = matrix[cls][cls];
    const FP = classes.reduce((s, a) => s + (a !== cls ? matrix[a][cls] : 0), 0);
    const FN = classes.reduce((s, p) => s + (p !== cls ? matrix[cls][p] : 0), 0);
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall    = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
    perClass[cls] = {
      TP, FP, FN,
      precision: parseFloat(precision.toFixed(4)),
      recall:    parseFloat(recall.toFixed(4)),
      f1:        parseFloat(f1.toFixed(4)),
    };
  });

  const n = classes.length;
  const macro = {
    precision: parseFloat((classes.reduce((s, c) => s + perClass[c].precision, 0) / n).toFixed(4)),
    recall:    parseFloat((classes.reduce((s, c) => s + perClass[c].recall, 0) / n).toFixed(4)),
    f1:        parseFloat((classes.reduce((s, c) => s + perClass[c].f1, 0) / n).toFixed(4)),
  };

  return { matrix, perClass, macro };
}

// ─── Training ─────────────────────────────────────────────────────────────────

/**
 * Train a Gaussian Naive Bayes model.
 *
 * @param {Array} records - each record must contain:
 *   { z_bbu, z_tbu, z_bbtb, kategori_gizi }
 *   (z-scores are computed by the controller before calling this function)
 * @returns {Object} model - stored as JSON in the database
 */
function trainModel(records) {
  if (!records || records.length === 0) {
    throw new Error('Tidak ada data untuk melatih model.');
  }

  // 1. Normalize class labels (handles legacy 6-class labels)
  const normalized = records
    .map((r) => ({ ...r, kategori_gizi: normalizeClass(r.kategori_gizi) }))
    .filter((r) => r.z_bbu != null && r.z_tbu != null && r.z_bbtb != null);

  if (normalized.length === 0) {
    throw new Error('Tidak ada record dengan Z-score yang valid.');
  }

  // 2. Stratified 80/20 split
  const { train, test } = stratifiedSplit(normalized, 0.2);

  // 3. Active classes (only classes with ≥ 1 training record)
  const activeClasses = [...new Set(train.map((r) => r.kategori_gizi))].sort();

  // 4. Class counts and priors (from training set)
  const classCounts = {};
  activeClasses.forEach((c) => { classCounts[c] = 0; });
  train.forEach((r) => { if (classCounts[r.kategori_gizi] !== undefined) classCounts[r.kategori_gizi]++; });

  const totalTrain = train.length;
  const priors = {};
  activeClasses.forEach((c) => {
    priors[c] = classCounts[c] / totalTrain;
  });

  // 5. Gaussian parameters: mean & variance per class per feature
  const gaussianParams = {};
  activeClasses.forEach((cls) => {
    gaussianParams[cls] = {};
    const classRecords = train.filter((r) => r.kategori_gizi === cls);
    FEATURE_KEYS.forEach((fKey) => {
      const values = classRecords
        .map((r) => r[fKey])
        .filter((v) => v != null && !isNaN(v));
      gaussianParams[cls][fKey] = meanVariance(values);
    });
  });

  // 6. Evaluate on test set
  const modelSoFar = { priors, gaussianParams, activeClasses };
  const testPredictions = test.map((r) =>
    predictFromModel(modelSoFar, r.z_bbu, r.z_tbu, r.z_bbtb).predicted_class
  );
  const testActuals = test.map((r) => r.kategori_gizi);

  const testCorrect = testPredictions.filter((p, i) => p === testActuals[i]).length;
  const accuracy = test.length > 0
    ? parseFloat(((testCorrect / test.length) * 100).toFixed(2))
    : 0;

  const metrics = computeMetrics(testPredictions, testActuals, activeClasses);

  return {
    // Model parameters
    priors,
    gaussianParams,
    activeClasses,
    featureKeys: FEATURE_KEYS,
    featureLabels: FEATURE_LABELS,

    // Data stats
    totalRecords: normalized.length,
    trainCount:   train.length,
    testCount:    test.length,
    classCounts,

    // Evaluation
    accuracy,
    metrics,

    trainedAt: new Date().toISOString(),
  };
}

// ─── Prediction ───────────────────────────────────────────────────────────────

/**
 * Predict nutritional status using a saved Gaussian NB model.
 *
 * @param {Object} model     - model object (as stored / retrieved from DB)
 * @param {number} z_bbu     - Z-score BB/U
 * @param {number} z_tbu     - Z-score TB/U
 * @param {number} z_bbtb    - Z-score BB/TB
 * @returns {Object} prediction result with steps and probabilities
 */
function predictFromModel(model, z_bbu, z_tbu, z_bbtb) {
  const { priors, gaussianParams, activeClasses } = model;

  const inputs = { z_bbu, z_tbu, z_bbtb };
  const steps  = [];
  const scores = {};

  activeClasses.forEach((cls) => {
    const prior = priors[cls] || 0;
    let logScore = Math.log(Math.max(prior, 1e-300));
    const featureProbs = {};

    FEATURE_KEYS.forEach((fKey) => {
      const params = gaussianParams[cls]?.[fKey] || { mean: 0, variance: 1 };
      const x      = inputs[fKey];
      const prob   = gaussianPDF(x, params.mean, params.variance);
      const safeP  = Math.max(prob, 1e-300);

      featureProbs[fKey] = {
        value:       x,
        mean:        parseFloat(params.mean.toFixed(4)),
        variance:    parseFloat(params.variance.toFixed(4)),
        stddev:      parseFloat(Math.sqrt(params.variance).toFixed(4)),
        probability: prob,
      };
      logScore += Math.log(safeP);
    });

    const score = Math.exp(logScore);
    scores[cls] = { prior, featureProbs, logScore, score };
    steps.push({ class: cls, prior, featureProbs, logScore });
  });

  // Normalise to posterior probabilities
  const totalScore = Object.values(scores).reduce((s, v) => s + v.score, 0) || 1;
  const probabilities = {};
  let maxProb = -Infinity;
  let predictedClass = activeClasses[0];

  activeClasses.forEach((cls) => {
    const prob = scores[cls].score / totalScore;
    probabilities[cls] = parseFloat((prob * 100).toFixed(4));
    if (prob > maxProb) {
      maxProb = prob;
      predictedClass = cls;
    }
  });

  return {
    predicted_class: predictedClass,
    probabilities,
    scores,
    inputs,
    steps,
    confidence: probabilities[predictedClass],
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  trainModel,
  predictFromModel,
  normalizeClass,
  CLASSES,
  FEATURE_KEYS,
  FEATURE_LABELS,
};
