const Order = require("../models/Order");
const Restaurant = require("../models/restaurants");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");

/* ----------------------- SHARED DATE FILTER LOGIC ----------------------- */
function buildSinceFilter(days) {
  const num = Number(days);

  if (!Number.isFinite(num) || num <= 0) {
    return {};
  }

  const sinceDate = new Date(Date.now() - num * 24 * 60 * 60 * 1000);
  return { createdAt: { $gte: sinceDate } };
}

/* ------------------------------------------------------------------------ */
/*                                DASHBOARD                                 */
/* ------------------------------------------------------------------------ */
const getDashboardStats = catchAsync(async (req, res) => {
  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  const matchFilter = { ...sinceFilter };

  // Apply restaurant filtering if the user is an owner
  if (req.ownerRestaurantId) {
    matchFilter.restaurantId = req.ownerRestaurantId;
  } else {
    const restaurantId = req.query.restaurant;
    if (restaurantId && restaurantId !== "all") {
      matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
  }

  const totalOrders = await Order.countDocuments({ ...matchFilter });
  const completedOrders = await Order.countDocuments({
    status: "completed",
    ...matchFilter,
  });
  const cancelledOrders = await Order.countDocuments({
    status: "cancelled",
    ...matchFilter,
  });
  const pendingOrders = await Order.countDocuments({
    status: "pending",
    ...matchFilter,
  });

  const revenueResult = await Order.aggregate([
    { $match: { status: "completed", ...matchFilter } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
  ]);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Weighted active users
  const orders = await Order.find({ ...matchFilter }).select("phoneNumber createdAt");
  const userScores = {};
  const weightFunction = (daysAgo) => {
    if (daysAgo <= 7) return 1;
    if (daysAgo <= 14) return 0.7;
    if (daysAgo <= 30) return 0.4;
    return 0;
  };

  const now = new Date();
  orders.forEach((order) => {
    const daysAgo = (now - order.createdAt) / (1000 * 60 * 60 * 24);
    const weight = weightFunction(daysAgo);
    if (weight > 0)
      userScores[order.phoneNumber] =
        (userScores[order.phoneNumber] || 0) + weight;
  });

  const totalWeightedActiveUsers = Object.values(userScores).filter(
    (score) => score >= 0.5
  ).length;

  res.status(200).json({
    success: true,
    stats: {
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      totalRevenue,
      totalWeightedActiveUsers,
    },
  });
});

/* ------------------------------------------------------------------------ */
/*                        TOP ORDERED ITEMS                                 */
/* ------------------------------------------------------------------------ */
const getTopOrderedItemsByName = catchAsync(async (req, res) => {
  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  const matchFilter = { ...sinceFilter };

  if (req.ownerRestaurantId) {
    matchFilter.restaurantId = req.ownerRestaurantId;
  } else {
    const restaurantId = req.query.restaurant;
    if (restaurantId && restaurantId !== "all") {
      matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
  }

  const topItems = await Order.aggregate([
    { $match: matchFilter },
    { $unwind: "$items" },
    { $group: { _id: "$items.name", totalOrdered: { $sum: "$items.quantity" } } },
    { $sort: { totalOrdered: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, name: "$_id", totalOrdered: 1 } },
  ]);

  res.status(200).json({ success: true, data: topItems });
});

/* ------------------------------------------------------------------------ */
/*                            SALES OVERVIEW                                */
/* ------------------------------------------------------------------------ */
const getSalesOverview = catchAsync(async (req, res) => {
  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  const matchFilter = { ...sinceFilter };

  if (req.ownerRestaurantId) {
    matchFilter.restaurantId = req.ownerRestaurantId;
  } else {
    const restaurantId = req.query.restaurant;
    if (restaurantId && restaurantId !== "all") {
      matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
  }

  const dailyOrders = await Order.aggregate([
    { $match: { status: "completed", ...matchFilter } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
    { $sort: { date: 1 } },
  ]);

  res.status(200).json({ success: true, dailyOrders });
});

/* ------------------------------------------------------------------------ */
/*                          TOP RESTAURANTS                                 */
/* ------------------------------------------------------------------------ */
const getTopRestaurants = catchAsync(async (req, res) => {
  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  const topRestaurants = await Order.aggregate([
    { $match: { ...sinceFilter } },
    { $group: { _id: "$restaurantId", totalOrders: { $sum: 1 } } },
    { $sort: { totalOrders: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "restaurants",
        localField: "_id",
        foreignField: "_id",
        as: "restaurant",
      },
    },
    { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: "$restaurant.name", totalOrders: 1 } },
  ]);

  res.status(200).json({ success: true, data: topRestaurants });
});

/* ------------------------------------------------------------------------ */
/*                        ORDERS DISTRIBUTION                               */
/* ------------------------------------------------------------------------ */
const getOrdersDistribution = catchAsync(async (req, res, next) => {

  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  const matchFilter = { ...sinceFilter };

  // Filter by restaurant
  if (req.ownerRestaurantId) {
    matchFilter.restaurantId = req.ownerRestaurantId;
  } else {
    const restaurantId = req.query.restaurant;
    if (restaurantId && restaurantId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return next(new AppError("Invalid restaurant id", 400));
      }
      matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
  }

  // Always group by status
  const distribution = await Order.aggregate([
    { $match: matchFilter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: distribution,
  });
});

/* ------------------------------------------------------------------------ */
/*                        RESTAURANTS NAMES                                 */
/* ------------------------------------------------------------------------ */
const getRestaurantsNames = catchAsync(async (req, res) => {
  let restaurants;

  if (req.ownerRestaurantId) {
    restaurants = await Restaurant.find(
      { _id: req.ownerRestaurantId },
      { _id: 1, name: 1 }
    );
  } else {
    restaurants = await Restaurant.find({}, { _id: 1, name: 1 }).sort({ name: 1 });
  }

  res.status(200).json({
    success: true,
    count: restaurants.length,
    data: restaurants,
  });
});

const getRestaurantName = catchAsync(async (req, res) => {
  const restaurantId = req.query.restaurant;

  // 1. Handle "all"
  if (!restaurantId || restaurantId.toLowerCase() === "all") {
    return res.status(200).json({
      success: true,
      data: { name: "All" },
    });
  }

  // 2. Handle specific ID
  const restaurant = await Restaurant.findById(restaurantId)
    .select("name")
    .lean();

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.status(200).json({
    success: true,
    data: { name: restaurant.name },
  });
});

// Fetch the restaurant assigned to the owner
const getOwnerRestaurant = catchAsync(async (req, res, next) => {
  if (!req.ownerRestaurantId) {
    return next(new AppError("Only owners can access this endpoint", 403));
  }

  const restaurant = await Restaurant.findById(req.ownerRestaurantId)
    .select("_id name")
    .lean();

  if (!restaurant) {
    return next(new AppError("No restaurant assigned to this owner", 404));
  }

  res.status(200).json({
    success: true,
    data: restaurant,
  });
});


module.exports = {
  getDashboardStats,
  getTopOrderedItemsByName,
  getSalesOverview,
  getTopRestaurants,
  getOrdersDistribution,
  getRestaurantsNames,
  getRestaurantName,
  getOwnerRestaurant
};
