const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/restaurants");
const Setting = require("../models/Setting");
const mongoose = require("mongoose");
const generateOrderId = require("../utils/generateOrderId");
const calculateDeliveryFee = require("../utils/calculateDeliveryFee");

const { orderTries, orderTimers } = require("../utils/dispatcher");


const parseNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getSchemaDefaultNumber = (path, fallback) => {
  const schemaPath = Setting.schema.path(path);
  if (!schemaPath) return fallback;
  const defaultOption = schemaPath.options?.default;
  const resolvedDefault =
    typeof defaultOption === "function" ? defaultOption() : defaultOption;
  const parsedDefault = parseNumeric(resolvedDefault);
  return parsedDefault !== null ? parsedDefault : fallback;
};

const DEFAULT_SETTING_VALUES = {
  delivery_fee: getSchemaDefaultNumber("delivery_fee", 0),
  delivery_per_km_rate: getSchemaDefaultNumber("delivery_per_km_rate", 0),
  max_delivery_distance_km: getSchemaDefaultNumber(
    "max_delivery_distance_km",
    null
  ),
  service_fee: getSchemaDefaultNumber("service_fee", 0),
};

const getSettingNumeric = (settings, key, fallback) => {
  const parsed = parseNumeric(settings?.[key]);
  if (parsed !== null) return parsed;

  if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTING_VALUES, key)) {
    const defaultValue = DEFAULT_SETTING_VALUES[key];
    if (defaultValue !== null && typeof defaultValue !== "undefined") {
      return defaultValue;
    }
  }

  return fallback;
};
exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    orderType,
    phoneNumber,
    alternatePhoneNumber,
    tableNumber,
    notes,
    location,
    restaurantId,
    address,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items provided in the order." });
  }

  const orderTypeKey = String(orderType || "").toLowerCase();
  const orderTypeMap = {
    "dine-in": "Dine-In",
    dinein: "Dine-In",
    dine: "Dine-In",
    takeaway: "Takeaway",
    "take-away": "Takeaway",
    pickup: "Takeaway",
    delivery: "Delivery",
  };
  const resolvedOrderType = orderTypeMap[orderTypeKey] || "Dine-In";
  const isDeliveryOrder = resolvedOrderType === "Delivery";

  const ids = items.map((item) => item._id);
  const menuItems = await MenuItem.find({ _id: { $in: ids } });

  if (!menuItems.length) {
    return next(new AppError("No valid menu items found for this order.", 400));
  }

  let restaurantDoc = null;
  if (restaurantId) {
    restaurantDoc = await Restaurant.findById(restaurantId);
    if (!restaurantDoc) {
      return res.status(400).json({
        status: "fail",
        message: "Restaurant not found with the provided restaurantId.",
      });
    }
  }

  const restaurantIds = [
    ...new Set(menuItems.map((item) => item.restaurantId.toString())),
  ];
  if (restaurantIds.length > 1) {
    return res.status(400).json({
      status: "fail",
      message: "All items in an order must belong to the same restaurant.",
      restaurants: restaurantIds,
    });
  }

  const resolvedRestaurantId = restaurantId || restaurantIds[0];
  if (!resolvedRestaurantId) {
    return next(
      new AppError("Unable to determine the restaurant for this order.", 400)
    );
  }

  if (!restaurantDoc) {
    restaurantDoc = await Restaurant.findById(resolvedRestaurantId);
    if (!restaurantDoc) {
      return res.status(400).json({
        status: "fail",
        message: "Restaurant not found for the provided menu items.",
      });
    }
  }

  const settings = await Setting.findOne().lean();
  const baseDeliveryFee = getSettingNumeric(settings, "delivery_fee", 0);
  const perKmRate = getSettingNumeric(settings, "delivery_per_km_rate", 0);
  const maxDeliveryDistanceKm = getSettingNumeric(
    settings,
    "max_delivery_distance_km",
    null
  );
  const defaultServiceFee = getSettingNumeric(settings, "service_fee", 0);

  let geoLocation;
  let customerCoords = null;
  if (
    location &&
    typeof location.lng !== "undefined" &&
    typeof location.lat !== "undefined"
  ) {
    const lng = Number(location.lng);
    const lat = Number(location.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      geoLocation = {
        type: "Point",
        coordinates: [lng, lat],
      };
      customerCoords = [lng, lat];
    }
  }

  const restaurantCoordsRaw = restaurantDoc?.address?.coordinates?.coordinates;
  let restaurantCoords = null;
  if (Array.isArray(restaurantCoordsRaw) && restaurantCoordsRaw.length === 2) {
    const parsedCoords = restaurantCoordsRaw.map((coord) => Number(coord));
    if (parsedCoords.every((coord) => Number.isFinite(coord))) {
      restaurantCoords = parsedCoords;
    }
  }

  const menuItemMap = {};
  menuItems.forEach((item) => {
    menuItemMap[item._id.toString()] = item;
  });

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = menuItemMap[String(item._id)];
    if (!menuItem) {
      return next(new AppError(`Menu item with ID ${item._id} not found`, 404));
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return next(
        new AppError(`Invalid quantity for menu item ${item._id}`, 400)
      );
    }

    subtotal += menuItem.price * quantity;

    orderItems.push({
      menuItem: menuItem._id,
      quantity,
      name: menuItem.name,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  let deliveryDistanceKm = null;
  const deliveryFeeOverride = parseNumeric(req.body.deliveryFee);
  let deliveryFee =
    deliveryFeeOverride !== null ? Math.max(0, deliveryFeeOverride) : 0;

  if (deliveryFeeOverride === null && isDeliveryOrder) {
    const { fee, distanceKm, exceededDistance } = calculateDeliveryFee({
      restaurantCoords,
      customerCoords,
      baseFee: baseDeliveryFee,
      perKmRate,
      maxDistanceKm: maxDeliveryDistanceKm,
      settings,
    });

    if (exceededDistance) {
      return next(
        new AppError(
          `Delivery distance (${distanceKm} km) exceeds the maximum allowed ${maxDeliveryDistanceKm} km.`,
          400
        )
      );
    }

    if (fee !== null && typeof fee !== "undefined") {
      deliveryFee = fee;
    }
    deliveryDistanceKm = distanceKm;
  }

  if (!isDeliveryOrder && deliveryFeeOverride === null) {
    deliveryFee = 0;
  }

  let serviceFee = parseNumeric(req.body.serviceFee);
  if (serviceFee === null) {
    serviceFee = defaultServiceFee;
  }
  serviceFee = Math.max(0, serviceFee);

  const totalPrice = Math.max(
    0,
    Math.round((subtotal + deliveryFee + serviceFee) * 100) / 100
  );

  const orderId = generateOrderId();

  const newOrder = await Order.create({
    orderId,
    items: orderItems,
    orderType: resolvedOrderType,
    subtotal,
    totalPrice,
    deliveryFee,
    serviceFee,
    deliveryDistanceKm,
    phoneNumber,
    tableNumber,
    notes,
    location: geoLocation,
    restaurantId: resolvedRestaurantId,
    address,
    alternatePhoneNumber,
    
    // add more fields like userId, status, timestamp if needed
  });

  // keep a reference to the created order document
  let responseOrder = newOrder;

  const io = req.app.get("io");
  if (newOrder && io) {
    try {
      // populate nested menuItem references so the frontend receives full objects
      const populatedOrder = await Order.findById(newOrder._id)
        .populate({ path: "items.menuItem", select: "name price _id" })
        .lean();

      // log the plain populated object for debugging (JSON.stringify avoids circulars)
      console.log(
        "[orderController] Emitting newOrder (populated plain object) to restaurant:",
        resolvedRestaurantId,
        JSON.stringify(populatedOrder)
      );

      // Emit only to clients subscribed to this restaurant room
      const room = `restaurant_${String(resolvedRestaurantId)}`;
      io.to(room).emit("newOrder", {
        message: "A new order has been placed!",
        order: populatedOrder,
      });

      // use the populated plain object for the response as well
      responseOrder = populatedOrder;
    } catch (err) {
      // fallback: emit a plain object derived from the mongoose document
      console.error(
        "[orderController] Error populating/sending newOrder via socket:",
        err
      );

      const plainOrder = newOrder.toObject ? newOrder.toObject() : JSON.parse(JSON.stringify(newOrder));
      console.log(
        "[orderController] Emitting newOrder (fallback plain object) to restaurant:",
        resolvedRestaurantId,
        JSON.stringify(plainOrder)
      );

      const room = `restaurant_${String(resolvedRestaurantId)}`;
      io.to(room).emit("newOrder", {
        message: "A new order has been placed!",
        order: plainOrder,
      });

      responseOrder = plainOrder;
    }
  }

  const responseData = { order: responseOrder };
  if (deliveryDistanceKm !== null) {
    responseData.deliveryDistanceKm = deliveryDistanceKm;
  }

  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: responseData,
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();
  const filter = {};
  let restaurant = null;

  // 1️⃣ If restaurantId is passed in query (explicit request)
  if (req.query?.restaurantId) {
    restaurant = await Restaurant.findById(req.query.restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found",
      });
    }
    filter.restaurantId = restaurant._id;
  }

  // 2️⃣ Owners can only see their own restaurant
  else if (role === "owner") {
    restaurant = await Restaurant.findOne({ ownerId: req.user._id })
      .sort({ createdAt: -1 });

    if (!restaurant) {
      return res.status(200).json({
        status: "success",
        message: "No restaurant found for this owner",
        data: { orders: [] },
      });
    }

    filter.restaurantId = restaurant._id;
  }

  // 3️⃣ Employees with a restaurantId on their user profile
  else if (req.user?.restaurantId) {
    restaurant = await Restaurant.findById(req.user.restaurantId);
    if (restaurant) filter.restaurantId = restaurant._id;
  }

  // 4️⃣ Managers or SuperAdmins can see all restaurants
  else if (role === "manager" || role === "superadmin") {
    // no filter applied — they can see all orders
  }

  // 5️⃣ Others (no access)
  else {
    return res.status(403).json({
      status: "fail",
      message: "You are not authorized to view orders",
    });
  }

  // Fetch orders (filtered if applicable)
  const parsePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
    return fallback;
  };

  const orderTypeMap = {
    "dine-in": "Dine-In",
    dinein: "Dine-In",
    dine: "Dine-In",
    takeaway: "Takeaway",
    "take-away": "Takeaway",
    pickup: "Takeaway",
    delivery: "Delivery",
  };

  const getQueryValue = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const rawPage = getQueryValue(req.query.page);
  const rawLimit = getQueryValue(req.query.limit);
  const rawStatus = getQueryValue(req.query.status);
  const rawType = getQueryValue(req.query.type);
  const rawSearch = getQueryValue(req.query.search);

  const limit = Math.min(parsePositiveInt(rawLimit, 10), 100);
  const requestedPage = parsePositiveInt(rawPage, 1);

  const queryFilter = { ...filter };

  if (rawStatus) {
    const normalizedStatus = String(rawStatus).trim().toLowerCase();
    if (normalizedStatus) {
      queryFilter.status = normalizedStatus;
    }
  }

  if (rawType) {
    const normalizedTypeKey = String(rawType).trim().toLowerCase();
    const mappedType = orderTypeMap[normalizedTypeKey] || String(rawType).trim();
    if (mappedType) {
      queryFilter.orderType = mappedType;
    }
  }

  let searchCondition = null;
  if (rawSearch) {
    const trimmedSearch = String(rawSearch).trim();
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch, "i");
      searchCondition = {
        $or: [
          { phoneNumber: regex },
          { orderId: regex },
          { customerName: regex },
        ],
      };
    }
  }

  const combinedFilter = searchCondition
    ? { ...queryFilter, ...searchCondition }
    : queryFilter;

  const totalOrders = await Order.countDocuments(combinedFilter);
  const totalPages = totalOrders > 0 ? Math.ceil(totalOrders / limit) : 0;
  const currentPage = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
  const skip = totalPages > 0 ? (currentPage - 1) * limit : 0;

  const orders = await Order.find(combinedFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "assignedEmployeeId",
      select: "name phoneNumber email role status",
    })
    .lean();

  const normalizedOrders = orders.map((order) => {
    const employee = order.assignedEmployeeId;
    if (employee && typeof employee === "object" && employee !== null && "_id" in employee) {
      return {
        ...order,
        assignedEmployeeId: employee._id,
        user: {
          _id: employee._id,
          name: employee.name,
          phoneNumber: employee.phoneNumber,
          email: employee.email,
          role: employee.role,
          status: employee.status,
        },
      };
    }
    return order;
  });

  // Attach restaurant info if one is specified
  let restaurantInfo = null;
  if (filter.restaurantId) {
    const { name, address, phoneNumber, street } = restaurant || {};
    restaurantInfo = { name, address, phoneNumber, street };
  }

  res.status(200).json({
    status: "success",
    message: "Orders retrieved successfully",
    data: {
      orders: normalizedOrders,
      restaurantInfo,
      pagination: {
        page: totalPages > 0 ? currentPage : 1,
        limit,
        totalPages,
        totalOrders,
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

  // Atomically set restaurantConfirmed=true only if the order isn't cancelled and not already confirmed
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: { $ne: "cancelled" }, restaurantConfirmed: { $ne: true } },
    { $set: { restaurantConfirmed: true, updatedAt: Date.now() } },
    { new: true }
  );

  if (!updated) {
    // Either the order was cancelled, already confirmed, or the condition failed
    throw new AppError("Cannot confirm order: it may be cancelled or already confirmed", 400);
  }

  // emit socket update (plain populated object)
  try {
    const io = req.app.get("io");
    if (io && updated) {
      const populated = await Order.findById(updated._id)
        .populate({ path: "items.menuItem", select: "name price _id" })
        .lean();
      const targetRest = populated?.restaurantId || updated.restaurantId || resolvedRestaurantId;
      const room = `restaurant_${String(targetRest)}`;
      console.log("[orderController] Emitting order:updated (confirmOrder) to room:", room, JSON.stringify(populated));
      io.to(room).emit("order:updated", { order: populated });
    }
  } catch (err) {
    console.error("[orderController] Failed to emit order:updated (confirmOrder):", err);
  }

  res.status(200).json({
    status: "success",
    message: "Order confirmed successfully",
    data: {
      order: updated,
    },
  });
});

// real time socket 


// Update order status
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  let status = req.body.status;

  // If cancelling, do an atomic update that prevents cancelling an already-accepted order
  if (String(status).toLowerCase() === "cancelled") {
    const updated = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $nin: ["cancelled", "completed"] } },
      { $set: { status, updatedAt: Date.now() } },
      { new: true }
    );
    if (!updated) {
      throw new AppError("Cannot cancel order: it may already be completed or cancelled", 400);
    }
    try {
      const io = req.app.get("io");
      if (io && updated) {
        const populated = await Order.findById(updated._id)
            .populate({ path: "items.menuItem", select: "name price _id" })
            .lean();
          const targetRest = populated?.restaurantId || updated.restaurantId;
          const room = `restaurant_${String(targetRest)}`;
          console.log("[orderController] Emitting order:updated (cancel) to room:", room, JSON.stringify(populated));
          io.to(room).emit("order:updated", { order: populated });
      }
    } catch (err) {
      console.error("[orderController] Failed to emit order:updated (cancel):", err);
    }

    return res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: { order: updated },
    });
  }

  // shoud not update if it is alredy accepted by delivery person
 
if (String(status).toLowerCase() === "accepted") {
  const order = await Order.findById(req.params.id);

    orderTries.delete(String(order._id));
if (orderTimers.has(String(order._id))) {
  clearTimeout(orderTimers.get(String(order._id)));
  orderTimers.delete(String(order._id));
}



  if (!order) {
    throw new AppError("Order not found", 404);
  }
  if (order.assignedEmployeeId && req.user && String(order.assignedEmployeeId) !== String(req.user._id)) {
    throw new AppError("Cannot accept order: it has already been accepted by a delivery person", 400);
  }
}

  // For other status changes, allow update
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  order.status = status;
  order.updatedAt = Date.now();
  await order.save({ validateBeforeSave: false });



  try {
    const io = req.app.get("io");
    if (io && order) {
      const populated = await Order.findById(order._id)
        .populate({ path: "items.menuItem", select: "name price _id" })
        .lean();
      const targetRest = populated?.restaurantId || order.restaurantId;
      const room = `restaurant_${String(targetRest)}`;
      console.log("[orderController] Emitting order:updated (status change) to room:", room, JSON.stringify(populated));
      io.to(room).emit("order:updated", { order: populated });
    }
  } catch (err) {
    console.error("[orderController] Failed to emit order:updated (status change):", err);
  }

  res.status(200).json({
    status: "success",
    message: "Order status updated successfully",
    data: { order },
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
  const orders = await Order.find({ assignedEmployeeId: userId })
  .sort({ createdAt: -1 })
  .limit(20)
  .populate({ path: 'items.menuItem', select: 'price' });
  // get the price of each order

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

// recent orders 
exports.getRecentOrders = catchAsync(async (req, res, next) => {
const {phoneNumber} = req.body
if (!phoneNumber) {
  return next(new AppError("Please provide phone number", 400));
}
// fetch recent orders for the number
const orders=await Order.find({phoneNumber})
.sort({createdAt: -1}).limit(20)
.populate('restaurantId', 'name address')
.populate('assignedEmployeeId', 'name phoneNumber');

if (!orders || orders.length === 0) {
  return next(new AppError("No recent orders found for this phone number", 404));
}

res.status(200).json({
  status: "success",
  message: "Recent orders retrieved successfully",
  data: {
    orders,
  },
});

});
