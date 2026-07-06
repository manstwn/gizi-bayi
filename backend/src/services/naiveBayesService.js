/**
 * Categorical Naive Bayes Service
 *
 * Uses WHO Z-score categories (BB/U, TB/U, BB/TB) for nutritional status
 * classification. 4 canonical output classes. Includes stratified 80/20
 * train-test split and full evaluation metrics (confusion matrix, precision,
 * recall, F1) using Laplace Smoothing.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ['Gizi Buruk', 'Gizi Kurang', 'Gizi Baik', 'Gizi Lebih'];

const FEATURE_KEYS = ['bbu', 'tbu', 'bbtb'];

const FEATURE_DOMAINS = {
  bbu: ['Sangat Kurang', 'Kurang', 'Normal', 'Badan Lebih'],
  tbu: ['Sangat Pendek', 'Pendek', 'Normal', 'Tinggi'],
  bbtb: ['Gizi Buruk', 'Gizi Kurang', 'Normal', 'Gizi Lebih']
};

const FEATURE_LABELS = {
  bbu:  'Kategori BB/U (Berat Badan per Umur)',
  tbu:  'Kategori TB/U (Tinggi Badan per Umur)',
  bbtb: 'Kategori BB/TB atau BB/PB (Berat Badan menurut Tinggi/Panjang)',
};

// ─── Class & Feature Normalisation ───────────────────────────────────────────

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

/**
 * Normalise raw feature category strings to standard domain keys.
 */
function normalizeFeature(fKey, val) {
  if (!val) return 'Normal';
  const v = val.toLowerCase().trim();
  if (fKey === 'bbu') {
    if (v.includes('sangat kurang')) return 'Sangat Kurang';
    if (v.includes('kurang')) return 'Kurang';
    if (v.includes('lebih')) return 'Badan Lebih';
    return 'Normal';
  }
  if (fKey === 'tbu') {
    if (v.includes('sangat pendek')) return 'Sangat Pendek';
    if (v.includes('pendek')) return 'Pendek';
    if (v.includes('tinggi')) return 'Tinggi';
    return 'Normal';
  }
  if (fKey === 'bbtb') {
    if (v.includes('buruk')) return 'Gizi Buruk';
    if (v.includes('kurang')) return 'Gizi Kurang';
    if (v.includes('lebih')) return 'Gizi Lebih';
    return 'Normal';
  }
  return val;
}

// ─── Stratified Split ─────────────────────────────────────────────────────────

/**
 * Stratified train-test split. Ensures every class is represented in both sets.
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
 */
function computeMetrics(predictions, actuals, classes) {
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
 * Train a Categorical Naive Bayes model using Laplace Smoothing.
 *
 * @param {Array} records - each record must contain:
 *   { bbu, tbu, bbtb, kategori_gizi }
 * @returns {Object} model - stored as JSON in the database
 */
function trainModel(records) {
  if (!records || records.length === 0) {
    throw new Error('Tidak ada data untuk melatih model.');
  }

  // 1. Normalize and standardise training data
  const normalized = records
    .map((r) => ({
      ...r,
      kategori_gizi: normalizeClass(r.kategori_gizi),
      bbu: normalizeFeature('bbu', r.bbu),
      tbu: normalizeFeature('tbu', r.tbu),
      bbtb: normalizeFeature('bbtb', r.bbtb),
    }))
    .filter((r) => r.bbu && r.tbu && r.bbtb);

  if (normalized.length === 0) {
    throw new Error('Tidak ada record dengan kategori Z-score yang valid.');
  }

  // 2. Stratified 80/20 split
  const { train, test } = stratifiedSplit(normalized, 0.2);

  // 3. Active classes
  const activeClasses = [...new Set(train.map((r) => r.kategori_gizi))].sort();

  // 4. Class counts and priors
  const classCounts = {};
  activeClasses.forEach((c) => { classCounts[c] = 0; });
  train.forEach((r) => { if (classCounts[r.kategori_gizi] !== undefined) classCounts[r.kategori_gizi]++; });

  const totalTrain = train.length;
  const priors = {};
  activeClasses.forEach((c) => {
    priors[c] = classCounts[c] / totalTrain;
  });

  // 5. Likelihoods with Laplace Smoothing
  const likelihoods = {};
  activeClasses.forEach((cls) => {
    likelihoods[cls] = {};
    const classRecords = train.filter((r) => r.kategori_gizi === cls);
    const totalClassCount = classRecords.length;

    FEATURE_KEYS.forEach((fKey) => {
      likelihoods[cls][fKey] = {};
      const domain = FEATURE_DOMAINS[fKey];
      const k = domain.length; // 4

      domain.forEach((val) => {
        const matchCount = classRecords.filter((r) => r[fKey] === val).length;
        // Laplace Smoothing: (n_ic + 1) / (n_c + k)
        const prob = (matchCount + 1) / (totalClassCount + k);
        likelihoods[cls][fKey][val] = parseFloat(prob.toFixed(6));
      });
    });
  });

  // 6. Evaluate on test set
  const modelSoFar = { priors, likelihoods, activeClasses };
  const testPredictions = test.map((r) =>
    predictFromModel(modelSoFar, r.bbu, r.tbu, r.bbtb).predicted_class
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
    likelihoods,
    activeClasses,
    featureKeys: FEATURE_KEYS,
    featureLabels: FEATURE_LABELS,
    featureDomains: FEATURE_DOMAINS,

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
 * Predict nutritional status using a saved Categorical NB model.
 *
 * @param {Object} model - model object (as stored / retrieved from DB)
 * @param {string} bbu   - category BB/U
 * @param {string} tbu   - category TB/U
 * @param {string} bbtb  - category BB/TB
 */
function predictFromModel(model, bbu, tbu, bbtb) {
  const { priors, likelihoods, activeClasses } = model;

  const rawInputs = { bbu, tbu, bbtb };
  const inputs = {
    bbu: normalizeFeature('bbu', bbu),
    tbu: normalizeFeature('tbu', tbu),
    bbtb: normalizeFeature('bbtb', bbtb)
  };

  const steps  = [];
  const scores = {};

  activeClasses.forEach((cls) => {
    const prior = priors[cls] || 0;
    let logScore = Math.log(Math.max(prior, 1e-300));
    const featureProbs = {};

    FEATURE_KEYS.forEach((fKey) => {
      const val = inputs[fKey];
      let prob = likelihoods[cls]?.[fKey]?.[val];
      if (prob === undefined) {
        const domain = FEATURE_DOMAINS[fKey];
        prob = 1 / (domain.length);
      }
      
      const safeP = Math.max(prob, 1e-300);

      featureProbs[fKey] = {
        value:       val,
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
    inputs: rawInputs,
    steps,
    confidence: probabilities[predictedClass],
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  trainModel,
  predictFromModel,
  normalizeClass,
  normalizeFeature,
  CLASSES,
  FEATURE_KEYS,
  FEATURE_DOMAINS,
  FEATURE_LABELS,
};
