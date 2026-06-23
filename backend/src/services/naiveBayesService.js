/**
 * Naive Bayes Service
 * Implements a Multinomial Naive Bayes classifier for nutritional status classification.
 * Uses Laplace (add-1) smoothing to handle zero probabilities.
 */

// ─── Feature Definitions ─────────────────────────────────────────────────────

const FEATURE_BINS = {
  umur_bulan: {
    label: 'Umur (Bulan)',
    bins: [
      { label: 'bayi', min: 0, max: 11 },
      { label: 'batita', min: 12, max: 35 },
      { label: 'balita', min: 36, max: 60 },
    ],
  },
  berat_badan: {
    label: 'Berat Badan (kg)',
    bins: [
      { label: 'sangat_kurang', min: 0, max: 6.99 },
      { label: 'kurang', min: 7, max: 8.99 },
      { label: 'normal', min: 9, max: 15.99 },
      { label: 'lebih', min: 16, max: Infinity },
    ],
  },
  tinggi_badan: {
    label: 'Tinggi Badan (cm)',
    bins: [
      { label: 'sangat_pendek', min: 0, max: 64.99 },
      { label: 'pendek', min: 65, max: 74.99 },
      { label: 'normal', min: 75, max: 99.99 },
      { label: 'tinggi', min: 100, max: Infinity },
    ],
  },
};

const CLASSES = ['Gizi Buruk (Severely Wasted)', 'Gizi Kurang (Wasted)', 'Gizi Baik (Normal)', 'Berisiko Gizi Lebih', 'Gizi Lebih (Overweight)', 'Obesitas'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Bin a single numeric value according to feature definition.
 */
function binValue(featureKey, value) {
  const feature = FEATURE_BINS[featureKey];
  if (!feature) return 'unknown';
  for (const bin of feature.bins) {
    if (value >= bin.min && value <= bin.max) return bin.label;
  }
  return feature.bins[feature.bins.length - 1].label;
}

/**
 * Discretize a record's continuous features into bins.
 */
function binRecord(record) {
  return {
    umur_bulan: binValue('umur_bulan', record.umur_bulan),
    berat_badan: binValue('berat_badan', record.berat_badan),
    tinggi_badan: binValue('tinggi_badan', record.tinggi_badan),
    kategori_gizi: normalizeClass(record.kategori_gizi),
  };
}

/**
 * Normalize class label — map any variant to our canonical classes.
 */
function normalizeClass(label) {
  if (!label) return 'Gizi Baik (Normal)';
  // Already a canonical label?
  if (CLASSES.includes(label)) return label;
  // Fallback mapping for legacy labels
  const l = label.toLowerCase();
  if (l.includes('buruk') || l.includes('severely wasted')) return 'Gizi Buruk (Severely Wasted)';
  if (l.includes('kurang') || l.includes('wasted')) return 'Gizi Kurang (Wasted)';
  if (l.includes('lebih') || l.includes('overweight')) return 'Gizi Lebih (Overweight)';
  if (l.includes('obesitas')) return 'Obesitas';
  if (l.includes('berisiko')) return 'Berisiko Gizi Lebih';
  return 'Gizi Baik (Normal)';
}

// ─── Training ────────────────────────────────────────────────────────────────

/**
 * Train a Naive Bayes model from an array of pemeriksaan records.
 * @param {Array} records - Raw DB records with {umur_bulan, berat_badan, tinggi_badan, kategori_gizi}
 * @returns {Object} model — includes priors, likelihoods, metadata, and training steps for display
 */
function trainModel(records) {
  if (!records || records.length === 0) {
    throw new Error('Tidak ada data untuk melatih model.');
  }

  // 1. Discretize
  const binnedRecords = records.map(binRecord);

  // 2. Find active classes (only classes present in data)
  const activeClasses = [...new Set(binnedRecords.map(r => r.kategori_gizi))];
  const totalRecords = binnedRecords.length;

  // 3. Class counts & priors
  const classCounts = {};
  activeClasses.forEach(c => { classCounts[c] = 0; });
  binnedRecords.forEach(r => { classCounts[r.kategori_gizi]++; });

  const priors = {};
  activeClasses.forEach(c => {
    priors[c] = classCounts[c] / totalRecords;
  });

  // 4. Feature likelihoods (with Laplace smoothing)
  const featureKeys = ['umur_bulan', 'berat_badan', 'tinggi_badan'];
  const likelihoods = {}; // likelihoods[class][feature][binLabel] = probability

  activeClasses.forEach(cls => {
    likelihoods[cls] = {};
    const classRecords = binnedRecords.filter(r => r.kategori_gizi === cls);
    const classCount = classRecords.length;

    featureKeys.forEach(fKey => {
      likelihoods[cls][fKey] = {};
      const bins = FEATURE_BINS[fKey].bins;
      const numBins = bins.length;

      // Count occurrences of each bin value for this class
      const binCounts = {};
      bins.forEach(b => { binCounts[b.label] = 0; });
      classRecords.forEach(r => { binCounts[r[fKey]]++; });

      // Apply Laplace smoothing: P(feature=v | class) = (count + 1) / (classCount + numBins)
      bins.forEach(b => {
        likelihoods[cls][fKey][b.label] = {
          count: binCounts[b.label],
          probability: (binCounts[b.label] + 1) / (classCount + numBins),
          smoothed_numerator: binCounts[b.label] + 1,
          smoothed_denominator: classCount + numBins,
        };
      });
    });
  });

  // 5. Compute accuracy with simple leave-one-out on the training data
  let correct = 0;
  binnedRecords.forEach(r => {
    const pred = predictFromModel({ priors, likelihoods, activeClasses, featureKeys }, r.umur_bulan, r.berat_badan, r.tinggi_badan, true /* already binned */);
    if (pred.predicted_class === r.kategori_gizi) correct++;
  });
  const accuracy = totalRecords > 0 ? (correct / totalRecords) * 100 : 0;

  return {
    priors,
    likelihoods,
    activeClasses,
    featureKeys,
    totalRecords,
    classCounts,
    accuracy: parseFloat(accuracy.toFixed(2)),
    featureBins: FEATURE_BINS,
    trainedAt: new Date().toISOString(),
  };
}

// ─── Prediction ──────────────────────────────────────────────────────────────

/**
 * Run prediction using a saved model.
 * @param {Object} model - The model object (as stored in DB, parsed JSON)
 * @param {number|string} umur - age in months (or already-binned string if preBinned=true)
 * @param {number|string} bb - weight in kg (or already-binned)
 * @param {number|string} tb - height in cm (or already-binned)
 * @param {boolean} preBinned - if true, inputs are already bin labels
 * @returns {Object} prediction with steps, probabilities, predicted class
 */
function predictFromModel(model, umur, bb, tb, preBinned = false) {
  const { priors, likelihoods, activeClasses, featureKeys } = model;

  // Bin the inputs
  const binnedInputs = preBinned
    ? { umur_bulan: umur, berat_badan: bb, tinggi_badan: tb }
    : {
        umur_bulan: binValue('umur_bulan', umur),
        berat_badan: binValue('berat_badan', bb),
        tinggi_badan: binValue('tinggi_badan', tb),
      };

  const steps = [];
  const scores = {};

  activeClasses.forEach(cls => {
    const prior = priors[cls];
    let logScore = Math.log(prior);
    const featureProbs = {};

    featureKeys.forEach(fKey => {
      const binLabel = binnedInputs[fKey];
      const entry = likelihoods[cls][fKey][binLabel];
      const prob = entry ? entry.probability : 1 / (Object.keys(likelihoods[cls][fKey]).length + 1);
      featureProbs[fKey] = {
        binLabel,
        probability: prob,
        numerator: entry ? entry.smoothed_numerator : 1,
        denominator: entry ? entry.smoothed_denominator : Object.keys(likelihoods[cls][fKey]).length + 1,
      };
      logScore += Math.log(prob);
    });

    scores[cls] = {
      prior,
      featureProbs,
      logScore,
      score: Math.exp(logScore), // unnormalized posterior
    };

    steps.push({ class: cls, prior, featureProbs, logScore });
  });

  // Normalize to get probabilities (softmax over scores)
  const scoreValues = Object.values(scores).map(s => s.score);
  const totalScore = scoreValues.reduce((a, b) => a + b, 0);
  const probabilities = {};
  let maxProb = -Infinity;
  let predictedClass = activeClasses[0];

  activeClasses.forEach(cls => {
    const prob = totalScore > 0 ? scores[cls].score / totalScore : 1 / activeClasses.length;
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
    binnedInputs,
    steps,
    confidence: probabilities[predictedClass],
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  trainModel,
  predictFromModel,
  binRecord,
  binValue,
  FEATURE_BINS,
  CLASSES,
};
