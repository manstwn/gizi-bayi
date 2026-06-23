const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NaiveBayesModel = sequelize.define('NaiveBayesModel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_model: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Model Naive Bayes',
  },
  model_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('model_json');
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue('model_json', JSON.stringify(value));
    },
  },
  jumlah_data: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  jumlah_kelas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  akurasi: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  tableName: 'naive_bayes_models',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = NaiveBayesModel;
