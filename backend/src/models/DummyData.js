const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DummyData = sequelize.define('DummyData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  umur_bulan: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  berat_badan: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tinggi_badan: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  kategori_gizi: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING, // e.g. "auto-generated", "manual", batch name
    defaultValue: 'auto-generated',
  },
}, {
  tableName: 'dummy_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = DummyData;
