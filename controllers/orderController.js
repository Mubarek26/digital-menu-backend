const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/restaurants");
const mongoose = require("mongoose");
const generateOrderId = require("../utils/generateOrderId");
exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    orderType,
    phoneNumber,
    tableNumber,
    paymentStatus,
    notes,
    location,
    restaurantId,
    address,
  } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items provided in the order." });
  }

  // extract the menu item IDs and quantities from the request body
  const ids = items.map((item) => item._id);
  const menuItems = await MenuItem.find({ _id: { $in: ids } }); 

  // check if the restaurant existed
  if (restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(400).json({ 
        status: "fail",
        message: "Restaurant not found with the provided restaurantId.",
      });
    }
  }
  
  // check if all the items belong to the same restaurant
const restaurantIds = [...new Set(menuItems.map((item) => item.restaurantId.toString()))];
  if (restaurantIds.length > 1) {
    return res.status(400).json({
      status: "fail",
      message: "All items in an order must belong to the same restaurant.",
      restaurants: restaurantIds, // optional, useful for debugging
    });
  }
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
      return next(new AppError(`Menu item with ID ${item._id} not found`, 404));
    }

    totalPrice += menuItem.price * item.quantity;
    // Create GeoJSON location object if location is provided
   
    orderItems.push({
      menuItem: menuItem._id,
      quantity: item.quantity,
      phoneNumber: phoneNumber, // Assuming phone number is passed in the request body
      tableNumber: tableNumber, // Assuming table number is passed in the request body
      name: menuItem.name,
      paymentStatus: paymentStatus, // Assuming payment status is passed in the request body
      notes: notes || "", // Optional customer note
      restaurantId: menuItem.restaurantId, // Associate order with the restaurant
      address: address || "", // Optional address for delivery
    });
  });
  // generate a unique order id
  const orderId =  generateOrderId();
   const geoLocation = location
      ? {
          type: "Point",
          coordinates: [location.lng, location.lat],
        }
      : undefined;
  const newOrder = await Order.create({
    orderId,
    items: orderItems,
    orderType,
    totalPrice,
    phoneNumber,
    tableNumber,
    notes,
    location: geoLocation, // Optional delivery location
    // If restaurantId was not provided by the client, derive it from the first menu item
    restaurantId: restaurantId || restaurantIds[0],
    address,
    // add more fields like userId, status, timestamp if needed
  });

  const io = req.app.get("io");
  if (newOrder && io) {
    io.emit("newOrder", {
      message: "A new order has been placed!",
      order: newOrder,
    });
  }

  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: {
      order: newOrder, // This should be replaced with actual data from the database
    },
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  // Build filter based on context in this order of priority:
  // 1. req.query.restaurantId (explicit request)
  // 2. If the authenticated user is an Owner -> their restaurant
  // 3. req.user.restaurantId (if present on the user document)
  const role = String(req.user?.role || "").toLowerCase();
  const filter = {};

  // Explicit restaurantId passed as query param (e.g. ?restaurantId=...)
  if (req.query && req.query.restaurantId) {
    filter.restaurantId = req.query.restaurantId;
    
  } else if (req.user && role === "owner") {
    // For owners, restrict to their restaurant
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { orders: [] },
      });
    }
    filter.restaurantId = restaurant._id;
  } else if (req.user && req.user.restaurantId) {
    // Some user documents may include a restaurantId (e.g. manager/employee)
    filter.restaurantId = req.user.restaurantId;
  }

  const orders = await Order.find(filter);
  const restaurant = await Restaurant.findById(filter.restaurantId);
  // distructure restaurant info if needed
  const { name, address, phoneNumber,street} = restaurant || {};
  res.status(200).json({
    status: "success",
    message: "Orders retrieved successfully",
    data: {
      orders: orders,
      restaurantInfo: { name, address, phoneNumber,street
      },
      
     
    },
  });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const orderId = req.body.OrderId || req.params.id;

  if (!orderId) {
    return next(new AppError("Please provide order id", 400));
  }

  // Aggregation pipeline to include user info
  const orders = await Order.aggregate([
    { $match: { orderId: orderId.trim() } },
    {
      $lookup: {
        from: "users",                  // users collection
        localField: "assignedEmployeeId", // field in Order schema
        foreignField: "_id",            // User’s _id
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true, // in case no user is assigned
      },
    },
    {
      $project: {
        orderId: 1,
        status: 1,
        createdAt: 1,
        // fields from user
        "userInfo.name": 1,
        "userInfo.phoneNumber": 1,
      },
    },
  ]);

  if (!orders || orders.length === 0) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Order retrieved successfully",
    data: orders[0], // return single order with user info
  });
});

// sets the order to confirmed
exports.confirmOrder = catchAsync(async (req, res, next) => {
  // Support both MongoDB _id and the generated orderId field in the URL param.
  // The route uses :orderId, but that value might be the custom orderId string
  // (e.g. ORD-123) or a Mongo ObjectId. Try to find by _id first (if valid),
  // otherwise look up by the `orderId` field.
  const param = req.params.orderId || req.params.id;
  let order = null;

  if (param && mongoose.Types.ObjectId.isValid(param)) {
    order = await Order.findById(param);
  }

  if (!order && param) {
    // try matching the custom orderId field
    order = await Order.findOne({ orderId: String(param).trim() });
  }

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.restaurantConfirmed = true;
  order.updatedAt = Date.now();
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "Order confirmed successfully",
    data: {
      order, // This should be replaced with actual data from the database
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
  await order.save({validateBeforeSave: false});
  res.status(200).json({
    status: "success",
    message: "Order status updated successfully",
    data: {
      order, // This should be replaced with actual data from the database
    },
  });
});


exports.getAllTotalRevenue = catchAsync(async (req, res, next) => {
  // Determine restaurant filter (same priority as getAllOrders)
  const role = String(req.user?.role || "").toLowerCase();
  let restaurantId;
  if (req.query && req.query.restaurantId) {
    try {
      restaurantId = mongoose.Types.ObjectId(req.query.restaurantId);
    } catch (err) {
      return next(new AppError("Invalid restaurantId", 400));
    }
  } else if (req.user && role === "owner") {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { totalRevenue: 0 },
      });
    }
    restaurantId = restaurant._id;
  } else if (req.user && req.user.restaurantId) {
    restaurantId = req.user.restaurantId;
  }

  const match = { status: "completed" };
  if (restaurantId) match.restaurantId = restaurantId;

  const result = await Order.aggregate([
    { $match: match },
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
  // Apply restaurant scoping similar to getAllOrders
  const role = String(req.user?.role || "").toLowerCase();
  const filter = {};
  if (req.query && req.query.restaurantId) {
    filter.restaurantId = req.query.restaurantId;
  } else if (req.user && role === "owner") {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { totalOrders: 0 },
      });
    }
    filter.restaurantId = restaurant._id;
  } else if (req.user && req.user.restaurantId) {
    filter.restaurantId = req.user.restaurantId;
  }

  const totalOrders = await Order.countDocuments(filter);
  res.status(200).json({
    status: "success",
    message: "Total orders retrieved successfully",
    data: {
      totalOrders, // This should be replaced with actual data from the database
    },
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  const orders = await Order.find({ assignedEmployeeId: userId });
  res.status(200).json({
    status: "success",
    data: { orders },
  });
});
exports.getTopSellingItems = catchAsync(async (req, res, next) => {
  // Determine restaurant context
  const role = String(req.user?.role || "").toLowerCase();
  let restaurantId;
  if (req.query && req.query.restaurantId) {
    try {
      restaurantId = mongoose.Types.ObjectId(req.query.restaurantId);
    } catch (err) {
      return next(new AppError("Invalid restaurantId", 400));
    }
  } else if (req.user && role === "owner") {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { topSellingItems: [] },
      });
    }
    restaurantId = restaurant._id;
  } else if (req.user && req.user.restaurantId) {
    restaurantId = req.user.restaurantId;
  }

  const pipeline = [];
  if (restaurantId) pipeline.push({ $match: { restaurantId } });
  pipeline.push(
    { $unwind: "$items" },
    {
      $lookup: {
        from: "menuitems",
        localField: "items.name",
        foreignField: "name",
        as: "menuItemInfo",
      },
    },
    { $unwind: "$menuItemInfo" },
    {
      $group: {
        _id: "$items.name",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$menuItemInfo.price"] },
        },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  );

  const result = await Order.aggregate(pipeline);
  res.status(200).json({
    status: "success",
    message: "Top selling items retrieved successfully",
    data: {
      topSellingItems: result, // This should be replaced with actual data from the database
    },
  });
});
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

exports.activeCustomers = catchAsync(async (req, res, next) => {
  // Determine restaurant context
  const role = String(req.user?.role || "").toLowerCase();
  let restaurantId;
  if (req.query && req.query.restaurantId) {
    try {
      restaurantId = mongoose.Types.ObjectId(req.query.restaurantId);
    } catch (err) {
      return next(new AppError("Invalid restaurantId", 400));
    }
  } else if (req.user && role === "owner") {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { activeCustomers: [] },
      });
    }
    restaurantId = restaurant._id;
  } else if (req.user && req.user.restaurantId) {
    restaurantId = req.user.restaurantId;
  }

  const match = { createdAt: { $gte: thirtyDaysAgo } };
  if (restaurantId) match.restaurantId = restaurantId;

  const result = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$phoneNumber",
        orders: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    message: "Active customers retrieved successfully",
    data: {
      activeCustomers: result, // This should be replaced with actual data from the database
    },
  });
});
