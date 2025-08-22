const express = require('express');
const mongoose = require('mongoose');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/globalErrorHandler');
const dotenv = require('dotenv');
const path = require('path');
const menuRoutes = require('./routes/menuRoutes'); // Import menu routes
const orderRoutes = require('./routes/orderRoutes')
// const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRouter'); // Import user routes
require('./utils/dispatcher.js')

dotenv.config(); // Load environment variables
const app = express();
// app.use(cors())
app.use(express.json());
app.use(cookieParser());
// const allowedOrigins = [
//   // "http://localhost:5173",
//   // "http://localhost:5174",
//   "http://192.168.162.170:5174",
//   "http://192.168.162.170:5173"
// ];
const cors = require('cors');
app.use(cors({ origin: true, credentials: true }));

// app.use(cors({
//   origin: function (origin, callback) {
//     // allow requests with no origin (like mobile apps or curl)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true); // origin allowed
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

app.use('/images', express.static(path.join(__dirname, 'uploads/foods')));

//routes to handle menu items

app.use('/api/v1/menu', menuRoutes); // Import and use menu routes
app.use('/api/v1/order', orderRoutes); // Import and use menu routes
app.use('/api/v1/users', userRouter);
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