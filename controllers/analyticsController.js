const Order = require("../models/Order");
const Restaurant = require("../models/restaurants");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

/* ----------------------- SHARED DATE FILTER LOGIC ----------------------- */
function buildSinceFilter(days) {
  if (days === "all") return {};
  const num = Number(days);
  const sinceDate = new Date(Date.now() - num * 24 * 60 * 60 * 1000);
  return { createdAt: { $gte: sinceDate } };
}

/* ------------------------------------------------------------------------ */
/*                                DASHBOARD                                 */
/* ------------------------------------------------------------------------ */
const getDashboardStats = catchAsync(async (req, res) => {
  const days = req.query.days || "all";
  const sinceFilter = buildSinceFilter(days);

  // Combine with restaurant filter
  const restaurantId = req.query.restaurant || "all";
  const matchFilter = { ...sinceFilter };

  if (restaurantId && restaurantId !== "all") {
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid restaurant ID" });
    }
  }

  // Orders
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

  // Revenue
  const revenueResult = await Order.aggregate([
    { $match: { status: "completed", ...matchFilter } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Weighted active users
  const orders = await Order.find({ ...matchFilter }).select(
    "phoneNumber createdAt"
  );

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

  // Response
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

    // Combine with restaurant filter
  const restaurantId = req.query.restaurant || "all";
  const matchFilter = { ...sinceFilter };
 if (restaurantId && restaurantId !== "all") {
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    } else {
        return res.status(400).json({ success: false, message: "Invalid restaurant ID" });
    }
}


  const topItems = await Order.aggregate([
    { $match: { ...matchFilter } },
    { $unwind: "$items" },
    {
      $group: { _id: "$items.name", totalOrdered: { $sum: "$items.quantity" } },
    },
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

    // Combine with restaurant filter
  const restaurantId = req.query.restaurant || "all";
  const matchFilter = { ...sinceFilter };
 if (restaurantId && restaurantId !== "all") {
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    } else {
        return res.status(400).json({ success: false, message: "Invalid restaurant ID" });
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
const getOrdersDistribution = catchAsync(async (req, res) => {
  const type = req.query.type || "status";
  if (!["status", "paymentStatus"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Use 'status' or 'paymentStatus'.",
    });
  }

  const days = req.query.days || "all";
  
  // Build filter for date range
  const sinceFilter = buildSinceFilter(days);
  
  // Combine with restaurant filter
  const restaurantId = req.query.restaurant || "all";
  const matchFilter = { ...sinceFilter };
 if (restaurantId && restaurantId !== "all") {
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        matchFilter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    } else {
        return res.status(400).json({ success: false, message: "Invalid restaurant ID" });
    }
}


  const distribution = await Order.aggregate([
    { $match: matchFilter },
    { $group: { _id: `$${type}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({ success: true, data: distribution });
});


/* ------------------------------------------------------------------------ */
/*                        RESTAURANTS NAMES                               */
/* ------------------------------------------------------------------------ */

const getRestaurantNames = catchAsync(async (req, res) => {
  const restaurants = await Restaurant.find({}, { _id: 1, name: 1 })
    .sort({ name: 1 }); // A → Z

  res.status(200).json({
    success: true,
    count: restaurants.length,
    data: restaurants,
  });
});



/* ------------------------------------------------------------------------ */

module.exports = {
  getDashboardStats,
  getTopOrderedItemsByName,
  getSalesOverview,
  getTopRestaurants,
  getOrdersDistribution,
  getRestaurantNames,
};
