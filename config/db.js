// db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected!');

    // Load background dispatcher AFTER successful connection
    require('../utils/dispatcher.js');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Stop the app if the DB connection fails
  }
};

module.exports = connectDB;
