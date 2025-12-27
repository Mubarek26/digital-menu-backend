
// db.js
const mongoose = require('mongoose');
require('dotenv').config();
const ensureSuperAdmin = require('../utils/ensureSuperAdmin');


const connectDB = async () => {
  try {
    if(process.env.NODE_ENV === 'production') {
      console.log('Connecting to Production Database');
      await mongoose.connect(process.env.DATABASE_PROD);
    }
    else{
      console.log('Connecting to Development Database');
      await mongoose.connect(process.env.DATABASE_DEV);
    }
    await ensureSuperAdmin();

    console.log('✅ MongoDB connected!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    process.exit(1); // Stop the app if the DB connection fails
  }
};

module.exports = connectDB;
