const Order = require("../models/Order");

async function getTotalOrders(req, res) {
  try {
    const days = Number(req.query.days); // optional: 7, 30, 90, etc.

    let count;

    if (days) {
      // Calculate the date 'days' ago
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Count only orders created after sinceDate
      count = await Order.countDocuments({
        createdAt: { $gte: sinceDate },
      });
    } else {
      // Count all orders if days not provided
      count = await Order.countDocuments();
    }

    return res.status(200).json({ success: true, count });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

async function getCompletedOrdersCount(req, res) {
  try {
    const days = Number(req.query.days); // optional: 7, 30, 90, etc.

    let count;

    if (days) {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      count = await Order.countDocuments({
        status: "completed",
        createdAt: { $gte: sinceDate }, // only orders from last 'days'
      });
    } else {
      count = await Order.countDocuments({ status: "completed" });
    }

    return res.status(200).json({ success: true, count });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

async function getCancelledOrdersCount(req, res) {
  try {
    const days = Number(req.query.days); // optional: 7, 30, 90, etc.
    let count;

    if (days) {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      count = await Order.countDocuments({
        status: "cancelled",
        createdAt: { $gte: sinceDate }, // only orders from last 'days'
      });
    } else {
      count = await Order.countDocuments({ status: "cancelled" });
    }

    return res.status(200).json({ success: true, count });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

// Returns total revenue across all orders (only includes orders with status === "completed")
async function getTotalRevenue(req, res) {
  try {
    const days = Number(req.query.days); // optional: 7, 30, 90, etc.
    const match = { status: "completed" };

    if (days) {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      match.createdAt = { $gte: sinceDate };
    }

    const result = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);

    const totalRevenue = result[0]?.totalRevenue || 0;

    return res.status(200).json({ success: true, totalRevenue });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

const getWeightedActiveUsers = async (req, res) => {
  try {
    const days = 30;
    const now = new Date();

    // Define recency weights (example)
    const weightFunction = (daysAgo) => {
      if (daysAgo <= 7) return 1; // orders in last 7 days → weight 1
      if (daysAgo <= 14) return 0.7; // 8-14 days → weight 0.7
      if (daysAgo <= 30) return 0.4; // 15-30 days → weight 0.4
      return 0; // older than 30 days → ignore
    };

    const activeThreshold = 0.5; // minimum score to count as active

    // Step 1: Get all orders in last (days) days
    const orders = await Order.find({
      createdAt: { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) },
    }).select("phoneNumber createdAt");

    // Step 2: Sum weighted orders per user
    const userScores = {};

    orders.forEach((order) => {
      const daysAgo = (now - order.createdAt) / (1000 * 60 * 60 * 24); // convert ms to days
      const weight = weightFunction(daysAgo);
      if (weight > 0) {
        userScores[order.phoneNumber] =
          (userScores[order.phoneNumber] || 0) + weight;
      }
    });

    // Step 3: Count users above threshold
    const activeUsers = Object.values(userScores).filter(
      (score) => score >= activeThreshold
    ).length;

    res.status(200).json({
      success: true,
      totalWeightedActiveUsers: activeUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getTopOrderedItemsByName = async (req, res) => {
  try {
    const topN = 10; // optional, default top 10
    const days = Number(req.query.days) || 30; // optional, default last 30 days

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const topItems = await Order.aggregate([
      // Step 1: filter by date
      { $match: { createdAt: { $gte: sinceDate } } },

      // Step 2: flatten the items array
      { $unwind: "$items" },

      // Step 3: group by item name and sum quantities
      {
        $group: {
          _id: "$items.name",
          totalOrdered: { $sum: "$items.quantity" },
        },
      },

      // Step 4: sort descending
      { $sort: { totalOrdered: -1 } },

      // Step 5: limit to top N
      { $limit: topN },
    ]);

    res.status(200).json({
      success: true,
      topItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getDailySalesOverview = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30; // default last 30 days
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate daily orders
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
          status: "completed", // only include completed orders
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          ordersCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } }, // sort by date ascending
    ]);

    // Compute total revenue for the period
    const totalRevenue = dailyOrders.reduce(
      (sum, day) => sum + day.totalRevenue,
      0
    );

    res.status(200).json({
      success: true,
      totalRevenue,
      dailyOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getTopRestaurants = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Order.aggregate([
      // 1️⃣ Filter orders by date
      {
        $match: {
          createdAt: { $gte: sinceDate },
        },
      },

      // 2️⃣ Group by restaurantId
      {
        $group: {
          _id: "$restaurantId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },

      // 3️⃣ Sort & limit top 10
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Lookup restaurant names and project a friendly shape
    const withNames = await Order.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: "$restaurantId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
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
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          name: "$restaurant.name",
          totalOrders: 1,
          totalRevenue: 1,
        },
      },
    ]);
    res.status(200).json({ success: true, data: withNames });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrdersDistribution = async (req, res) => {
  try {
    const type = req.query.type || "status"; // "status" or "paymentStatus"
    if (!["status", "paymentStatus"].includes(type)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid type. Use 'status' or 'paymentStatus'.",
        });
    }

    const days = Number(req.query.days) || 30; // default 30 days
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const distribution = await Order.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: `$${type}`, // dynamically group by "status" or "paymentStatus"
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }, // optional: sort descending
    ]);

    res.status(200).json({ success: true, data: distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTotalOrders,
  getCompletedOrdersCount,
  getCancelledOrdersCount,
  getTotalRevenue,
  getWeightedActiveUsers,
  getTopOrderedItemsByName,
  getDailySalesOverview,
  getTopRestaurants,
  getOrdersDistribution,
};
