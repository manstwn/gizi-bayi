const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Balita = require('./Balita');
const User = require('./User');

const Pemeriksaan = sequelize.define('Pemeriksaan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  balita_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Balita,
      key: 'id',
    },
  },
  tanggal_pemeriksaan: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  berat_badan: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tinggi_badan: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  umur_bulan: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hasil_fuzzy: {
    type: DataTypes.FLOAT, // Nilai defuzzifikasi
  },
  kategori_gizi: {
    type: DataTypes.STRING, // Gizi Buruk, Gizi Kurang, Gizi Baik, Gizi Lebih
  },
  petugas_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  catatan: {
    type: DataTypes.TEXT,
  },
});

Balita.hasMany(Pemeriksaan, { foreignKey: 'balita_id', as: 'pemeriksaan' });
Pemeriksaan.belongsTo(Balita, { foreignKey: 'balita_id', as: 'balita' });

User.hasMany(Pemeriksaan, { foreignKey: 'petugas_id' });
Pemeriksaan.belongsTo(User, { foreignKey: 'petugas_id' });

module.exports = Pemeriksaan;
