const Setting = require('../models/Setting');
const NutritionalStatusService = require('../services/nutritionalStatusService');
const PairDataService = require('../services/pairDataService');

exports.getFuzzyParameters = async (req, res) => {
  // Keeping this for compatibility with frontend components that expect it, 
  // but returning a simplified version
  try {
    let setting = await Setting.findOne({ where: { key: 'app_settings' } });
    if (!setting) {
      return res.json({ 
        version: '2.0 (Z-Score Based)',
        method: 'WHO Standard 2020'
      });
    }
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

exports.updateFuzzyParameters = async (req, res) => {
  try {
    let setting = await Setting.findOne({ where: { key: 'app_settings' } });
    if (setting) {
      setting.value = req.body;
      await setting.save();
    } else {
      setting = await Setting.create({ key: 'app_settings', value: req.body });
    }
    res.json({ message: 'Settings updated', data: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
};

exports.simulateCalculation = async (req, res) => {
  try {
    const { bb, tb, umur } = req.body;
    
    if (!bb || !tb || umur === undefined) {
      return res.status(400).json({ message: 'Missing required inputs (bb, tb, umur)' });
    }

    const assessment = NutritionalStatusService.assess(
      parseFloat(bb), 
      parseFloat(tb), 
      parseFloat(umur)
    );

    res.json(assessment);
  } catch (error) {
    res.status(400).json({ message: 'Assessment error', error: error.message });
  }
};

exports.getPairData = async (req, res) => {
  try {
    res.json(PairDataService.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pair data' });
  }
};
