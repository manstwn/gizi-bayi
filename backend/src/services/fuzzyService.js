/**
 * Fuzzy Mamdani Service for Toddler Nutrition Status
 */

class FuzzyService {
  // Membership Functions for Weight (Berat Badan - BB) in kg
  static getBBMembership(val, params) {
    return {
      rendah: this.trapezoid(val, ...params.rendah),
      normal: this.triangle(val, ...params.normal),
      tinggi: this.trapezoid(val, ...params.tinggi),
    };
  }

  // Membership Functions for Height (Tinggi Badan - TB) in cm
  static getTBMembership(val, params) {
    return {
      pendek: this.trapezoid(val, ...params.pendek),
      sedang: this.triangle(val, ...params.sedang),
      tinggi: this.trapezoid(val, ...params.tinggi),
    };
  }

  // Membership Functions for Age (Umur) in months
  static getUmurMembership(val, params) {
    return {
      bayi: this.trapezoid(val, ...params.bayi),
      toddler: this.triangle(val, ...params.toddler),
      balita: this.trapezoid(val, ...params.balita),
    };
  }

  // Membership Functions for Output (Status Gizi) - Scale 0-100
  static getOutputMembership(val, params) {
    return {
      buruk: this.trapezoid(val, ...params.buruk),
      kurang: this.triangle(val, ...params.kurang),
      baik: this.triangle(val, ...params.baik),
      lebih: this.trapezoid(val, ...params.lebih),
    };
  }

  // Helper: Triangular membership function
  static triangle(x, a, b, c) {
    if (a === undefined || b === undefined || c === undefined) return 0;
    return Math.max(0, Math.min((x - a) / (b - a), (c - x) / (c - b)));
  }

  // Helper: Trapezoidal membership function
  static trapezoid(x, a, b, c, d) {
    if (a === undefined || b === undefined || c === undefined || d === undefined) return 0;
    return Math.max(0, Math.min((x - a) / (b - a), 1, (d - x) / (d - c)));
  }

  // Default parameters
  static DEFAULT_PARAMS = {
    bb: { rendah: [0, 0, 5, 10], normal: [8, 15, 22], tinggi: [20, 25, 40, 40] },
    tb: { pendek: [0, 0, 50, 75], sedang: [70, 95, 120], tinggi: [110, 130, 160, 160] },
    umur: { bayi: [0, 0, 6, 12], toddler: [10, 24, 38], balita: [36, 48, 60, 60] },
    output: { buruk: [0, 0, 20, 40], kurang: [30, 50, 70], baik: [60, 80, 90], lebih: [85, 95, 100, 100] },
    centers: { buruk: 20, kurang: 50, baik: 80, lebih: 95 }
  };

  // Core Process: Calculate Status
  static calculate(bb, tb, umur, customParams = null) {
    const p = customParams || this.DEFAULT_PARAMS;
    const bbM = this.getBBMembership(bb, p.bb);
    const tbM = this.getTBMembership(tb, p.tb);
    const uM = this.getUmurMembership(umur, p.umur);

    // Rule Base (Dynamic from parameters)
    const rules = p.rules || [];
    
    const aggregated = { buruk: 0, kurang: 0, baik: 0, lebih: 0 };
    
    rules.forEach(rule => {
      // Calculate weight based on rule inputs (Min operator for AND)
      let weight = 1;
      if (rule.bb) weight = Math.min(weight, bbM[rule.bb] || 0);
      if (rule.tb) weight = Math.min(weight, tbM[rule.tb] || 0);
      if (rule.umur) weight = Math.min(weight, uM[rule.umur] || 0);
      
      // Aggregate results using Max operator
      aggregated[rule.output] = Math.max(aggregated[rule.output], weight);
    });

    // Defuzzification - Centroid Method
    const centers = p.centers;
    let numerator = 0;
    let denominator = 0;

    Object.keys(aggregated).forEach(key => {
      numerator += aggregated[key] * centers[key];
      denominator += aggregated[key];
    });

    const resultValue = denominator === 0 ? 0 : numerator / denominator;

    // Map result value to category
    let category = 'Gizi Baik';
    if (resultValue <= 35) category = 'Gizi Buruk';
    else if (resultValue <= 65) category = 'Gizi Kurang';
    else if (resultValue <= 88) category = 'Gizi Baik';
    else category = 'Gizi Lebih';

    return {
      value: resultValue,
      category: category,
      details: {
        fuzzification: { bbM, tbM, uM },
        aggregation: aggregated
      }
    };
  }
}

module.exports = FuzzyService;
