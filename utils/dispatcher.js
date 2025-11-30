// utils/dispatcher.js


const cron = require("node-cron");
const User = require('../models/UserModel');
const Order = require("../models/Order");

console.log('[dispatcher] loading...');


const ROLE_MAP = {
  "Dine-In": "Waiter",
  "Takeaway": "Waiter",
  "Delivery": "Delivery",
};


const TEN_MINUTES_IN_MS = 5 * 60 * 1000;

// GLOBAL state shared across the entire backend
const orderTimers = new Map();

const orderTries = new Map();

// ---------------------------------------------------------------------
// SAFE TIMER SET
// ---------------------------------------------------------------------
function setSafeTimeout(orderId, employeeId) {

  if (orderTimers.has(String(orderId))) {
    clearTimeout(orderTimers.get(String(orderId)));
  }

  const t = setTimeout(() => handleAssignmentTimeout(orderId, employeeId), 60 * 1000);
  orderTimers.set(String(orderId), t);
}

// ---------------------------------------------------------------------
// ASSIGN EMPLOYEE TO ORDER
// ---------------------------------------------------------------------
async function assignEmployee(order, employee) {
  order.assignedEmployeeId = employee._id;
  order.status = "pending";
  await order.save();

  employee.last_assigned_at = new Date();
  await employee.save({ validateBeforeSave: false });


  const tried = orderTries.get(String(order._id)) || new Set();
  tried.add(String(employee._id));
  orderTries.set(String(order._id), tried);

  const fresh = await Order.findById(order._id).lean();

  console.log(`[dispatcher] → assigned order ${order._id} to ${employee._id}`);


  io.to(String(employee._id)).emit('order_assigned', { order: fresh });


  setSafeTimeout(order._id, employee._id);
}

// ---------------------------------------------------------------------
// TIMEOUT HANDLER
// ---------------------------------------------------------------------
async function handleAssignmentTimeout(orderId, employeeId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;


    if (order.status !== 'pending' || String(order.assignedEmployeeId) !== String(employeeId)) {
      return;
    }

    console.log(`[dispatcher] Employee ${employeeId} missed timeout on order ${orderId}`);


    io.to(String(employeeId)).emit('order_unassigned', { orderId });


    order.assignedEmployeeId = null;
    await order.save();

    orderTimers.delete(String(order._id));

    const tried = orderTries.get(String(order._id)) || new Set();



    let nextEmployee = await User.findOne({
      role: ROLE_MAP[order.orderType],
      status: 'available',
      _id: { $nin: [...tried] }
    }).sort({ last_assigned_at: 1 });



    if (!nextEmployee) {
      console.log(`[dispatcher] No available employees for ${orderId}. Broadcasting...`);

      const room = order.restaurantId ? `restaurant_${String(order.restaurantId)}` : null;
      if (room) io.to(room).emit('order_available', { orderId, order });

      io.emit('order_available_global', { orderId, order });



      orderTries.delete(String(order._id));
      return;
    }



    await assignEmployee(order, nextEmployee);

  } catch (err) {
    console.error("[dispatcher] Timeout handler error:", err);
  }
}

// ---------------------------------------------------------------------

// START DISPATCHER (REQUIRES IO)
// ---------------------------------------------------------------------
function dispatcher(ioInstance) {
  io = ioInstance;

  cron.schedule("*/30 * * * * *", async () => {
    console.log("[dispatcher] checking...");

    const cutoff = new Date(Date.now() - TEN_MINUTES_IN_MS);
    const staleOrders = await Order.find({
      status: "pending",
      restaurantConfirmed: false,
      createdAt: { $lte: cutoff },
    });

    for (const order of staleOrders) {
      order.status = "cancelled";
      await order.save({ validateBeforeSave: false });

      orderTries.delete(String(order._id));

      if (orderTimers.has(String(order._id))) {
        clearTimeout(orderTimers.get(String(order._id)));
        orderTimers.delete(String(order._id));
      }

      console.log(`Cancelled order ${order._id} due to restaurant inactivity`);
    }

    const unassigned = await Order.find({
      status: "pending",
      assignedEmployeeId: null,
      restaurantConfirmed: true,
    });

    for (const order of unassigned) {
      const employee = await User.findOne({
        role: ROLE_MAP[order.orderType],
        status: "available"
      }).sort({ last_assigned_at: 1 });

      if (employee) {
        await assignEmployee(order, employee);
      }
    }
  });
}

// Export correctly
module.exports = {
  dispatcher,
  orderTimers,
  orderTries
};