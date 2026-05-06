const Setting = require('../models/Setting');
const FuzzyService = require('../services/fuzzyService');

const DEFAULT_FUZZY_PARAMS = {
  bb: {
    rendah: [0, 0, 5, 10],
    normal: [8, 15, 22],
    tinggi: [20, 25, 40, 40]
  },
  tb: {
    pendek: [0, 0, 50, 75],
    sedang: [70, 95, 120],
    tinggi: [110, 130, 160, 160]
  },
  umur: {
    bayi: [0, 0, 6, 12],
    toddler: [10, 24, 38],
    balita: [36, 48, 60, 60]
  },
  output: {
    buruk: [0, 0, 20, 40],
    kurang: [30, 50, 70],
    baik: [60, 80, 90],
    lebih: [85, 95, 100, 100]
  },
  centers: {
    buruk: 20,
    kurang: 50,
    baik: 80,
    lebih: 95
  },
  rules: [
    // 👶 BAYI
    { bb: 'rendah', tb: 'pendek', umur: 'bayi', output: 'buruk' },
    { bb: 'rendah', tb: 'sedang', umur: 'bayi', output: 'buruk' },
    { bb: 'rendah', tb: 'tinggi', umur: 'bayi', output: 'kurang' },
    { bb: 'normal', tb: 'pendek', umur: 'bayi', output: 'kurang' },
    { bb: 'normal', tb: 'sedang', umur: 'bayi', output: 'baik' },
    { bb: 'normal', tb: 'tinggi', umur: 'bayi', output: 'baik' },
    { bb: 'tinggi', tb: 'pendek', umur: 'bayi', output: 'kurang' },
    { bb: 'tinggi', tb: 'sedang', umur: 'bayi', output: 'baik' },
    { bb: 'tinggi', tb: 'tinggi', umur: 'bayi', output: 'lebih' },
    // 🧒 TODDLER
    { bb: 'rendah', tb: 'pendek', umur: 'toddler', output: 'buruk' },
    { bb: 'rendah', tb: 'sedang', umur: 'toddler', output: 'buruk' },
    { bb: 'rendah', tb: 'tinggi', umur: 'toddler', output: 'kurang' },
    { bb: 'normal', tb: 'pendek', umur: 'toddler', output: 'kurang' },
    { bb: 'normal', tb: 'sedang', umur: 'toddler', output: 'baik' },
    { bb: 'normal', tb: 'tinggi', umur: 'toddler', output: 'baik' },
    { bb: 'tinggi', tb: 'pendek', umur: 'toddler', output: 'kurang' },
    { bb: 'tinggi', tb: 'sedang', umur: 'toddler', output: 'baik' },
    { bb: 'tinggi', tb: 'tinggi', umur: 'toddler', output: 'lebih' },
    // 🧑 BALITA
    { bb: 'rendah', tb: 'pendek', umur: 'balita', output: 'buruk' },
    { bb: 'rendah', tb: 'sedang', umur: 'balita', output: 'buruk' },
    { bb: 'rendah', tb: 'tinggi', umur: 'balita', output: 'kurang' },
    { bb: 'normal', tb: 'pendek', umur: 'balita', output: 'kurang' },
    { bb: 'normal', tb: 'sedang', umur: 'balita', output: 'baik' },
    { bb: 'normal', tb: 'tinggi', umur: 'balita', output: 'baik' },
    { bb: 'tinggi', tb: 'pendek', umur: 'balita', output: 'kurang' },
    { bb: 'tinggi', tb: 'sedang', umur: 'balita', output: 'baik' },
    { bb: 'tinggi', tb: 'tinggi', umur: 'balita', output: 'lebih' },
  ]
};

exports.getFuzzyParameters = async (req, res) => {
  try {
    let setting = await Setting.findOne({ where: { key: 'fuzzy_parameters' } });
    if (!setting) {
      return res.json(DEFAULT_FUZZY_PARAMS);
    }
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fuzzy parameters', error: error.message });
  }
};

exports.updateFuzzyParameters = async (req, res) => {
  try {
    const { key, ...params } = req.body;
    let setting = await Setting.findOne({ where: { key: 'fuzzy_parameters' } });
    
    if (setting) {
      setting.value = req.body;
      await setting.save();
    } else {
      setting = await Setting.create({
        key: 'fuzzy_parameters',
        value: req.body
      });
    }
    
    res.json({ message: 'Fuzzy parameters updated successfully', data: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fuzzy parameters', error: error.message });
  }
};

exports.simulateCalculation = async (req, res) => {
  try {
    const { bb, tb, umur } = req.body;
    let setting = await Setting.findOne({ where: { key: 'fuzzy_parameters' } });
    const params = setting ? setting.value : DEFAULT_FUZZY_PARAMS;

    const result = FuzzyService.calculate(
      parseFloat(bb), 
      parseFloat(tb), 
      parseFloat(umur), 
      params
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'Calculation error', error: error.message });
  }
};
