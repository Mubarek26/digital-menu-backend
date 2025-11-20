const express = require("express");
const mongoose = require("mongoose");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/globalErrorHandler");
const dotenv = require("dotenv");
const path = require("path");
const menuRoutes = require("./routes/menuRoutes"); // Import menu routes
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
// const cors = require('cors');
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/userRouter"); // Import user routes
const paymentRoutes = require("./routes/paymentRoutes");
const restaurantRoues = require("./routes/restaurantRoutes");
const setupSwagger = require("./swagger/swagger");
const settingsRoutes = require("./routes/settingsRoutes");
const analyticsRoute = require("./routes/analyticsRoute");
dotenv.config(); // Load environment variables
const app = express();
setupSwagger(app);
// app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const cors = require("cors");
app.use(cors({ origin: true, credentials: true }));

// Serve uploaded files (menu images, restaurant images, etc.) from the uploads folder
app.use("/images", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//routes to handle menu items

app.use("/api/v1/menu", menuRoutes); // Import and use menu routes
// Mount restaurant routes before the menu alias so specific restaurant paths
// (e.g. /api/v1/restaurants/my) are handled by restaurantRoues instead of
// being captured by menuRoutes' dynamic '/:id' route.
app.use("/api/v1/restaurants", restaurantRoues);
// Alias: also mount menu routes under /api/v1/restaurants (kept after the
// restaurant routes to avoid route collisions with explicit restaurant paths)
app.use("/api/v1/restaurants", menuRoutes);
app.use("/api/v1/order", orderRoutes); // Import and use menu routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/analytics", analyticsRoute);

// (restaurant routes already mounted above)
// console.log('app: mounted /api/v1/settings');
app.all("*", (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(error); // Pass the error to the next middleware
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
