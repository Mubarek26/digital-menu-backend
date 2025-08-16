const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, orderType, phoneNumber, tableNumber, paymentStatus, notes } =
    req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items provided in the order." });
  }
  // extract the menu item IDs and quantities from the request body
  const ids = items.map((item) => item._id);
  const menuItems = await MenuItem.find({ _id: { $in: ids } }); //
  // Create a map of menu items for easy lookup
  const menuItemMap = {};
  menuItems.forEach((item) => {
    menuItemMap[item._id] = item;
  });

  let totalPrice = 0;
  let orderItems = [];

  items.forEach((item) => {
    const menuItem = menuItemMap[item._id];
    if (!menuItem) {
      return next(
        new AppError(`Menu item with ID ${item._id} not found`, 404)
      );
    }

    totalPrice += menuItem.price * item.quantity;

    orderItems.push({
      menuItem: menuItem._id,
      quantity: item.quantity,
      phoneNumber: phoneNumber, // Assuming phone number is passed in the request body
      tableNumber: tableNumber, // Assuming table number is passed in the request body
      name: menuItem.name,
      paymentStatus: paymentStatus, // Assuming payment status is passed in the request body
      notes: notes || "", // Optional customer note
    });
  });
  const newOrder = await Order.create({
    items: orderItems,
    orderType,
    totalPrice,
    phoneNumber,
    tableNumber,
    notes,
    // add more fields like userId, status, timestamp if needed
  });

  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: {
      order: newOrder, // This should be replaced with actual data from the database
    },
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
  res.status(200).json({
    status: "success",
    message: "All orders retrieved successfully",
    data: {
      orders: orders,
    },
  });
});

// Update order status
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  let status = req.body.status;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  order.status = status;
  order.updatedAt = Date.now();
  await order.save();
  res.status(200).json({
    status: "success",
    message: "Order status updated successfully",
    data: {
      order, // This should be replaced with actual data from the database
    },
  });
});

exports.getAllTotalRevenue = catchAsync(async (req, res, next) => {
  const result = await Order.aggregate([
    {
      $match: { status: "completed" }, // Assuming you want to calculate revenue for completed orders
    },

    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    message: "Total revenue calculated successfully",
    data: {
      totalRevenue: result.length > 0 ? result[0].totalRevenue : 0, // If no completed orders, return 0
    },
  });
});

// Get total number of orders
exports.getTotalOrders = catchAsync(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  res.status(200).json({
    status: "success",
    message: "Total orders retrieved successfully",
    data: {
      totalOrders, // This should be replaced with actual data from the database
    },
  });
});

exports.getTopSellingItems = catchAsync(async (req, res, next) => {
  const result = await Order.aggregate([
    {
      $unwind: "$items" // Unwind the items array to get individual items
    },
    {
      $lookup: {
        from: "menuitems", // Assuming the collection name for MenuItem is "menuitems"
        localField: "items.name",
        foreignField: "name",
        as: "menuItemInfo"
    }
    },
    {
      $unwind: "$menuItemInfo" // Unwind the menuItemInfo array to get individual menu item details
  },
    {
      $group: {
        _id: "$items.name",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$menuItemInfo.price"] } },
      },
    },
    {
      $sort: { totalSold: -1 } // Sort by total sold in descending order
    },
    {
      $limit: 10 // Limit to top 10 selling items
    }
  ]);
  res.status(200).json({
    status: "success",
    message: "Top selling items retrieved successfully",
    data: {
      topSellingItems: result, // This should be replaced with actual data from the database
    },
  })
});
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

exports.activeCustomers = catchAsync(async (req, res, next) => {
  const result = await Order.aggregate([
    
      {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }, // Filter orders from the last 30 days
      },
    },
    {
      $group: {
        _id: "$phoneNumber", // Group by phone number
        orders: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" }
      }
    }
  ])
  


  
  res.status(200).json({
    status: "success",
    message: "Active customers retrieved successfully",
    data: {
      activeCustomers: result, // This should be replaced with actual data from the database
    },
  })
})