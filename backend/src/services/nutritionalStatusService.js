const fs = require('fs');
const path = require('path');
const pairDataService = require('./pairDataService');

class NutritionalStatusService {
  constructor() {
    this.decisionRules = [];
    this.loadDecisionRules();
  }

  /**
   * Load decision rules from new-data.csv at startup
   */
  loadDecisionRules() {
    try {
      const csvPath = path.join(__dirname, '../../..', 'new-data.csv');
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 4) {
            this.decisionRules.push({
              bbu: parts[0],
              tbu: parts[1],
              bbtb: parts[2],
              keputusan: parts[3]
            });
          }
        }
        console.log(`Loaded ${this.decisionRules.length} decision rules from new-data.csv.`);
      } else {
        console.warn(`Decision rules file not found at: ${csvPath}`);
      }
    } catch (error) {
      console.error('Error loading decision rules in NutritionalStatusService:', error);
    }
  }

  /**
   * Determine final nutritional status based on decision matrix from new-data.csv
   */
  getDecision(bbuCategory, tbuCategory, bbtbCategory) {
    // Map internal categories to CSV categories
    const bbuMap = {
      'Berat badan sangat kurang': 'Sangat Kurang',
      'Berat badan kurang': 'Kurang',
      'Berat badan normal': 'Normal',
      'Risiko berat badan lebih': 'Badan Lebih'
    };

    const tbuMap = {
      'Sangat pendek': 'Sangat Pendek',
      'Pendek': 'Pendek',
      'Normal': 'Normal',
      'Tinggi': 'Tinggi'
    };

    const bbtbMap = {
      'Gizi buruk': 'Gizi Buruk',
      'Gizi kurang': 'Gizi Kurang',
      'Gizi baik': 'Normal',
      'Gizi lebih': 'Gizi Lebih'
    };

    const targetBbu = bbuMap[bbuCategory] || bbuCategory;
    const targetTbu = tbuMap[tbuCategory] || tbuCategory;
    const targetBbtb = bbtbMap[bbtbCategory] || bbtbCategory;

    // Search rule
    const rule = this.decisionRules.find(r => 
      r.bbu.toLowerCase() === targetBbu.toLowerCase() &&
      r.tbu.toLowerCase() === targetTbu.toLowerCase() &&
      r.bbtb.toLowerCase() === targetBbtb.toLowerCase()
    );

    if (rule) {
      return rule.keputusan;
    }

    // Fallback: Map BB/TB category to standard casing
    const fallbackMap = {
      'Gizi buruk': 'Gizi Buruk',
      'Gizi kurang': 'Gizi Kurang',
      'Gizi baik': 'Gizi Baik',
      'Gizi lebih': 'Gizi Lebih'
    };
    return fallbackMap[bbtbCategory] || bbtbCategory;
  }

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
    if (z < -3) return 'Berat badan sangat kurang';
    if (z < -2) return 'Berat badan kurang';
    if (z <= 1) return 'Berat badan normal';
    return 'Risiko berat badan lebih';
  }

  /**
   * Get Category for TB/U (Height-for-Age)
   */
  getTBUCategory(z) {
    if (z < -3) return 'Sangat pendek';
    if (z < -2) return 'Pendek';
    if (z <= 3) return 'Normal';
    return 'Tinggi';
  }

  /**
   * Get Category for BB/TB (Weight-for-Height)
   */
  getBBTBCategory(z) {
    if (z < -3) return 'Gizi buruk';
    if (z < -2) return 'Gizi kurang';
    if (z <= 1) return 'Gizi baik';
    return 'Gizi lebih';
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

    const bbuCategory = this.getBBUCategory(zBBU);
    const tbuCategory = this.getTBUCategory(zTBU);
    const bbtbCategory = this.getBBTBCategory(zBBTB);

    return {
      indices: {
        bbu: { z: zBBU, category: bbuCategory, ref: refBBU },
        tbu: { z: zTBU, category: tbuCategory, ref: refTBU },
        bbtb: { z: zBBTB, category: bbtbCategory, ref: refBBTB }
      },
      summary: {
        status: this.getDecision(bbuCategory, tbuCategory, bbtbCategory),
        stunting: zTBU < -2 ? 'Stunted' : 'Normal',
        wasting: zBBTB < -2 ? 'Wasted' : 'Normal',
        underweight: zBBU < -2 ? 'Underweight' : 'Normal'
      }
    };
  }
}

module.exports = new NutritionalStatusService();
