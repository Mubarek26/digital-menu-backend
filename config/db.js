// db.js
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync'); // Adjust the path as necessary
require('dotenv').config();

const connectDB = catchAsync( async () => {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected!');
  } );

module.exports = connectDB;
