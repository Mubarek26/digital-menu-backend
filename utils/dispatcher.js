// utils/dispatcher.js
const cron = require("node-cron");
const User = require('../models/UserModel');
const Order = require("../models/Order");

const ROLE_MAP = {
  "Dine-In": "Waiter",
  "Takeaway": "Waiter",
  "Delivery": "Delivery",
};

const TEN_MINUTES_IN_MS = 5 * 60 * 1000;

// Map to keep track of timers for each order
const orderTimers = new Map();

// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("Checking for unassigned orders...");

  const cutoff = new Date(Date.now() - TEN_MINUTES_IN_MS);
  const staleOrders = await Order.find({
    status: "pending",
    restaurantConfirmed: false,
    createdAt: { $lte: cutoff },
  });

  for (const order of staleOrders) {
    order.status = "cancelled";
    order.updatedAt = new Date();
    await order.save({ validateBeforeSave: false });

    const timerId = orderTimers.get(order._id.toString());
    if (timerId) {
      clearTimeout(timerId);
      orderTimers.delete(order._id.toString());
    }

    console.log(`Cancelled order ${order._id} due to restaurant inactivity.`);
  }

  const unassignedOrders = await Order.find({ assignedEmployeeId: null, status: "pending", restaurantConfirmed: true });

  for (const order of unassignedOrders) {
    // Get available employee
    const employee = await User.findOne({ 
        role: ROLE_MAP[order.orderType], 
        status: "available" 
      })
      .sort({ last_assigned_at: 1 });

    if (employee) {
      // Assign order
      order.assignedEmployeeId = employee._id;
      order.status = "pending"; // ensure status is pending
      await order.save();

      employee.last_assigned_at = new Date();
      await employee.save({ validateBeforeSave: false });

      console.log(`Assigned order ${order._id} to employee ${employee._id}`);

      // Start 1-minute acceptance timer
      if (orderTimers.has(order._id.toString())) {
        clearTimeout(orderTimers.get(order._id.toString())); // clear previous timer if any
      }

      const timer = setTimeout(async () => {
        const currentOrder = await Order.findById(order._id);

        // If still pending after 1 minute, unassign and mark as unaccepted
        if (currentOrder.status === "pending") {
          console.log(`Employee ${employee._id} did not accept order ${order._id}. Reassigning...`);
          currentOrder.assignedEmployeeId = null; // make order available again
          await currentOrder.save();

          orderTimers.delete(order._id.toString()); // remove timer
          // Immediately attempt to reassign to another available employee
          const nextEmployee = await User.findOne({ 
            role: ROLE_MAP[currentOrder.orderType], 
            status: "available",
            _id: { $ne: employee._id } // exclude previous employee
          }).sort({ last_assigned_at: 1 });

          if (nextEmployee) {
            currentOrder.assignedEmployeeId = nextEmployee._id;
            await currentOrder.save();
            nextEmployee.last_assigned_at = new Date();
            await nextEmployee.save({ validateBeforeSave: false });
            console.log(`Immediately reassigned order ${currentOrder._id} to employee ${nextEmployee._id}`);
            // Optionally, start a new timer for the next employee
            const newTimer = setTimeout(async () => {
              const recheckOrder = await Order.findById(currentOrder._id);
              if (recheckOrder.status === "pending") {
                recheckOrder.assignedEmployeeId = null;
                await recheckOrder.save();
                orderTimers.delete(currentOrder._id.toString());
                console.log(`Second employee did not accept order ${currentOrder._id}. Order remains unassigned.`);
              }
            }, 60 * 1000);
            orderTimers.set(currentOrder._id.toString(), newTimer);
          }
        }
      }, 2 * 60 * 1000); // 2 minutes

      orderTimers.set(order._id.toString(), timer);
    }
  }
});

