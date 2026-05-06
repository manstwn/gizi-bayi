const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Balita = sequelize.define('Balita', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('L', 'P'),
    allowNull: false,
  },
  tanggal_lahir: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  nama_orang_tua: {
    type: DataTypes.STRING,
  },
  alamat: {
    type: DataTypes.TEXT,
  },
  kontak: {
    type: DataTypes.STRING,
  },
});

module.exports = Balita;
