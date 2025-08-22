// utils/dispatcher.js
const cron = require("node-cron");
const User = require('../models/UserModel');
const Order = require("../models/Order");

const ROLE_MAP = {
  "Dine-In": "employee",
  "Takeaway": "employee",
  "Delivery": "employee",
};

// Runs every minute
cron.schedule("* * * * *", async () => {
  console.log("Checking for unassigned orders...");

  const unassignedOrders = await Order.find({ assignedEmployeeId: null });

  for (const order of unassignedOrders) {
    const employee = await User.findOne({ 
        role: ROLE_MAP[order.orderType], 
        status: "available" 
      })
      .sort({ last_assigned_at: 1 });

    if (employee) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { assignedEmployeeId: employee._id } }
      );
      employee.last_assigned_at = new Date();
      await employee.save({validateBeforeSave:false});

      console.log(`Assigned order ${order._id} to employee ${employee._id}`);
    }
  }
});
