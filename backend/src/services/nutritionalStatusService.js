const pairDataService = require('./pairDataService');

class NutritionalStatusService {
  /**
   * Calculate Z-Score for a given value and reference data
   * @param {number} value - The actual measurement (BB or TB)
   * @param {Object} ref - SD values (median, plus1SD, minus1SD, etc.)
   */
  calculateZScore(value, ref) {
    if (!ref) return 0;
    
    const { minus3SD, minus2SD, minus1SD, median, plus1SD, plus2SD, plus3SD } = ref;
    
    if (
      minus3SD != null && minus2SD != null && minus1SD != null && 
      median != null && 
      plus1SD != null && plus2SD != null && plus3SD != null
    ) {
      if (value === median) return 0;
      
      if (value < median) {
        if (value >= minus1SD) {
          // Between 0 and -1 SD
          const diff = median - minus1SD;
          return diff > 0 ? (value - median) / diff : 0;
        } else if (value >= minus2SD) {
          // Between -1 and -2 SD
          const diff = minus1SD - minus2SD;
          const dist = minus1SD - value;
          return -1 - (diff > 0 ? (dist / diff) : 0);
        } else if (value >= minus3SD) {
          // Between -2 and -3 SD
          const diff = minus2SD - minus3SD;
          const dist = minus2SD - value;
          return -2 - (diff > 0 ? (dist / diff) : 0);
        } else {
          // Below -3 SD (extrapolate using the -2 to -3 SD interval)
          const diff = minus2SD - minus3SD;
          const dist = minus3SD - value;
          return -3 - (diff > 0 ? (dist / diff) : 0);
        }
      } else {
        if (value <= plus1SD) {
          // Between 0 and +1 SD
          const diff = plus1SD - median;
          return diff > 0 ? (value - median) / diff : 0;
        } else if (value <= plus2SD) {
          // Between +1 and +2 SD
          const diff = plus2SD - plus1SD;
          const dist = value - plus1SD;
          return 1 + (diff > 0 ? (dist / diff) : 0);
        } else if (value <= plus3SD) {
          // Between +2 and +3 SD
          const diff = plus3SD - plus2SD;
          const dist = value - plus2SD;
          return 2 + (diff > 0 ? (dist / diff) : 0);
        } else {
          // Above +3 SD (extrapolate using the +2 to +3 SD interval)
          const diff = plus3SD - plus2SD;
          const dist = value - plus3SD;
          return 3 + (diff > 0 ? (dist / diff) : 0);
        }
      }
    }
    
    // Fallback to simple calculation
    const { plus1SD: p1, minus1SD: m1 } = ref;
    if (value >= median) {
      return (p1 - median) > 0 ? (value - median) / (p1 - median) : 0;
    } else {
      return (median - m1) > 0 ? (value - median) / (median - m1) : 0;
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
