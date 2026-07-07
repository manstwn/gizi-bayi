const app = require('./app');
const sequelize = require('./config/database');
const User = require('./models/User');
const NaiveBayesModel = require('./models/NaiveBayesModel');
const Pemeriksaan = require('./models/Pemeriksaan');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Custom migration to safely add columns in SQLite (prevents alter: true UNIQUE/FK check bugs)
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tableDefinition = await queryInterface.describeTable(Pemeriksaan.tableName);
      
      if (!tableDefinition.metode) {
        await queryInterface.addColumn(Pemeriksaan.tableName, 'metode', {
          type: require('sequelize').DataTypes.STRING,
          defaultValue: 'WHO',
        });
        console.log("Added 'metode' column to Pemeriksaan table.");
      }
      
      if (!tableDefinition.model_id) {
        await queryInterface.addColumn(Pemeriksaan.tableName, 'model_id', {
          type: require('sequelize').DataTypes.INTEGER,
          allowNull: true,
        });
        console.log("Added 'model_id' column to Pemeriksaan table.");
      }


    } catch (migErr) {
      console.error('Error running custom migrations:', migErr.message);
    }

    // Sync models safely
    await sequelize.sync({ force: false });
    console.log('Database synced.');

    // Seed initial admin user if not exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await User.create({
        nama: 'Administrator',
        username: 'admin',
        password: 'adminpassword',
        role: 'admin'
      });
      console.log('Default admin user created (admin / adminpassword)');
    }

    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);
      
      // Start Cloudflare Tunnel if in production
      if (process.env.NODE_ENV === 'production' && process.env.CLOUDFLARE_TUNNEL_TOKEN) {
        try {
          const { tunnel } = require('cloudflared');
          console.log('--------------------------------------------------');
          console.log('☁️  CLOUDFLARE TUNNEL: Initializing...');
          
          const tunnelInstance = tunnel({ '--token': process.env.CLOUDFLARE_TUNNEL_TOKEN });
          
          if (tunnelInstance.url) {
            tunnelInstance.url.then((tunnelUrl) => {
              console.log('✅ CLOUDFLARE TUNNEL: Successfully Connected!');
              console.log(`🌐 LIVE URL: ${tunnelUrl}`);
              console.log('--------------------------------------------------');
            }).catch(err => {
              console.error('❌ CLOUDFLARE TUNNEL: Failed to get URL:', err.message);
            });
          }

          if (tunnelInstance.connections) {
            tunnelInstance.connections.forEach((conn, i) => {
              conn.then(() => console.log(`🔗 CLOUDFLARE: Connection #${i+1} established`));
            });
          }

        } catch (err) {
          console.log('--------------------------------------------------');
          console.error('⚠️  CLOUDFLARE TUNNEL: Error starting tunnel');
          console.error('👉 Make sure you ran: npm install cloudflared');
          console.error(`Reason: ${err.message}`);
          console.log('--------------------------------------------------');
        }
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();
