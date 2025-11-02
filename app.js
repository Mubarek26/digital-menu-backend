const express = require('express');
const mongoose = require('mongoose');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/globalErrorHandler');
const dotenv = require('dotenv');
const path = require('path');
const menuRoutes = require('./routes/menuRoutes'); // Import menu routes
const orderRoutes = require('./routes/orderRoutes')
const categoryRoutes = require('./routes/categoryRoutes');
// const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRouter'); // Import user routes
const paymentRoutes = require('./routes/paymentRoutes')
const restaurantRoues=require('./routes/restaurantRoutes')
const setupSwagger = require('./swagger/swagger');
const settingsRoutes = require('./routes/settingsRoutes');

dotenv.config(); // Load environment variables
const app = express();
setupSwagger(app);
// app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const cors = require('cors');
app.use(cors({ origin: true, credentials: true }));

// Serve uploaded files (menu images, restaurant images, etc.) from the uploads folder
app.use('/images', express.static(path.join(__dirname, 'uploads')));

//routes to handle menu items

app.use('/api/v1/menu', menuRoutes); // Import and use menu routes
app.use('/api/v1/order', orderRoutes); // Import and use menu routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/restaurants', restaurantRoues);
// console.log('app: mounted /api/v1/settings');
app.all('*', (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(error); // Pass the error to the next middleware
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;