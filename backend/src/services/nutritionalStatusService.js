const pairDataService = require('./pairDataService');

class NutritionalStatusService {
  /**
   * Calculate Z-Score for a given value and reference data
   * @param {number} value - The actual measurement (BB or TB)
   * @param {Object} ref - SD values (median, plus1SD, minus1SD, etc.)
   */
  calculateZScore(value, ref) {
    if (!ref) return 0;
    
    const { median, plus1SD, minus1SD } = ref;
    
    if (value >= median) {
      // Positive Z-Score
      return (value - median) / (plus1SD - median);
    } else {
      // Negative Z-Score
      return (value - median) / (median - minus1SD);
    }
  }

  /**
   * Get Category for BB/U (Weight-for-Age)
   */
  getBBUCategory(z) {
    if (z < -3) return 'Sangat Kurang (Severely Underweight)';
    if (z < -2) return 'Kurang (Underweight)';
    if (z <= 1) return 'Berat Badan Normal';
    return 'Risiko Berat Badan Lebih';
  }

  /**
   * Get Category for TB/U (Height-for-Age)
   */
  getTBUCategory(z) {
    if (z < -3) return 'Sangat Pendek (Severely Stunted)';
    if (z < -2) return 'Pendek (Stunted)';
    if (z <= 3) return 'Tinggi Badan Normal';
    return 'Tinggi';
  }

  /**
   * Get Category for BB/TB (Weight-for-Height)
   */
  getBBTBCategory(z) {
    if (z < -3) return 'Gizi Buruk (Severely Wasted)';
    if (z < -2) return 'Gizi Kurang (Wasted)';
    if (z <= 1) return 'Gizi Baik (Normal)';
    if (z <= 2) return 'Berisiko Gizi Lebih';
    if (z <= 3) return 'Gizi Lebih (Overweight)';
    return 'Obesitas';
  }

  /**
   * Comprehensive Assessment
   */
  assess(bb, tb, umur, gender) {
    // 1. BB/U
    const refBBU = pairDataService.getSDValues(gender, 'umur-berat', umur);
    const zBBU = this.calculateZScore(bb, refBBU);
    
    // 2. TB/U
    const refTBU = pairDataService.getSDValues(gender, 'umur-tinggi', umur);
    const zTBU = this.calculateZScore(tb, refTBU);
    
    // 3. BB/TB (or BB/PB)
    const type = (umur < 24) ? 'panjang-berat' : 'tinggi-berat';
    const refBBTB = pairDataService.getSDValues(gender, type, tb);
    const zBBTB = this.calculateZScore(bb, refBBTB);

    return {
      indices: {
        bbu: { z: zBBU, category: this.getBBUCategory(zBBU), ref: refBBU },
        tbu: { z: zTBU, category: this.getTBUCategory(zTBU), ref: refTBU },
        bbtb: { z: zBBTB, category: this.getBBTBCategory(zBBTB), ref: refBBTB }
      },
      summary: {
        status: this.getBBTBCategory(zBBTB), // Primary indicator
        stunting: zTBU < -2 ? 'Stunted' : 'Normal',
        wasting: zBBTB < -2 ? 'Wasted' : 'Normal',
        underweight: zBBU < -2 ? 'Underweight' : 'Normal'
      }
    };
  }
}

module.exports = new NutritionalStatusService();
