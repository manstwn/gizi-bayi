const fs = require('fs');
const path = require('path');

class PairDataService {
  constructor() {
    this.data = {
      umurToBerat: [],
      umurToTinggi: [],
      panjangToBerat: []
    };
    this.loadData();
  }

  loadData() {
    const pairsDir = path.join(__dirname, '../../../pairs');
    
    try {
      this.data.umurToBerat = this.parseCSV(path.join(pairsDir, 'data-umur-to-berat-pair.csv'));
      this.data.umurToTinggi = this.parseCSV(path.join(pairsDir, 'data-umur-to-tinggi-pair.csv'));
      this.data.panjangToBerat = this.parseCSV(path.join(pairsDir, 'data-panjang-to-berat-pair.csv'));
      console.log('Pair data loaded successfully');
    } catch (error) {
      console.error('Error loading pair data:', error);
    }
  }

  parseCSV(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = parseFloat(values[index]);
      });
      return obj;
    });
  }

  // Linear interpolation helper
  interpolate(x, data, xKey, yKey) {
    if (data.length === 0) return 0;
    
    // Find the two points to interpolate between
    let lower = data[0];
    let upper = data[data.length - 1];

    if (x <= lower[xKey]) return lower[yKey];
    if (x >= upper[xKey]) return upper[yKey];

    for (let i = 0; i < data.length - 1; i++) {
      if (x >= data[i][xKey] && x <= data[i + 1][xKey]) {
        lower = data[i];
        upper = data[i + 1];
        break;
      }
    }

    // Linear interpolation formula: y = y0 + (x - x0) * (y1 - y0) / (x1 - x0)
    const x0 = lower[xKey];
    const y0 = lower[yKey];
    const x1 = upper[xKey];
    const y1 = upper[yKey];

    if (x1 === x0) return y0;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
  }

  getSDValues(type, xValue) {
    let data = [];
    let xKey = '';
    
    switch (type) {
      case 'umur-berat':
        data = this.data.umurToBerat;
        xKey = 'Umur_Bulan';
        break;
      case 'umur-tinggi':
        data = this.data.umurToTinggi;
        xKey = 'Umur_Bulan';
        break;
      case 'panjang-berat':
        data = this.data.panjangToBerat;
        xKey = 'Panjang_Badan_cm';
        break;
      default:
        return null;
    }

    if (data.length === 0) return null;

    return {
      minus3SD: this.interpolate(xValue, data, xKey, 'Minus_3SD'),
      minus2SD: this.interpolate(xValue, data, xKey, 'Minus_2SD'),
      minus1SD: this.interpolate(xValue, data, xKey, 'Minus_1SD'),
      median: this.interpolate(xValue, data, xKey, 'Median'),
      plus1SD: this.interpolate(xValue, data, xKey, 'Plus_1SD'),
      plus2SD: this.interpolate(xValue, data, xKey, 'Plus_2SD'),
      plus3SD: this.interpolate(xValue, data, xKey, 'Plus_3SD')
    };
  }
}

module.exports = new PairDataService();
