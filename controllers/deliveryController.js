const Order = require("../models/Order");
const catchAsync = require("../utils/catchAsync");

const PERIODS = [
  { key: "daily", days: 1 },
  { key: "weekly", days: 7 },
  { key: "monthly", days: 30 },
  { key: "all", days: null }
];

// Helper: get starting date from days
const getSinceDate = (days) => {
  if (!days) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
};

exports.getDeliveryEarnings = catchAsync(async (req, res, next) => {
  
  const role = (req.user?.role || "").toLowerCase();
  const now = new Date();

  // Base match for all queries
  const baseMatch = {
    status: "completed",
    orderType: "Delivery",
    assignedEmployeeId: { $ne: null }
  };

  // If the user is a delivery worker → show only their own earnings
  if (role === "delivery") {
    baseMatch.assignedEmployeeId = req.user._id;
  }

  const reports = {};

  for (const period of PERIODS) {
    const since = getSinceDate(period.days);

    const match = { ...baseMatch };
    if (since) match.createdAt = { $gte: since };

    const rows = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$assignedEmployeeId",
          deliveriesCount: { $sum: 1 },
          totalDeliveryFee: { $sum: "$deliveryFee" },
          totalPrice: { $sum: "$totalPrice" }
          ,
          totalServiceFee: { $sum: "$serviceFee" }

        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "worker"
        }
      },
      { $unwind: "$worker" },
      {
        $project: {
          _id: 0,
          workerId: "$worker._id",
          name: "$worker.name",
          phoneNumber: "$worker.phoneNumber",
          deliveriesCount: 1,
          totalDeliveryFee: 1,
          totalPrice: 1
          ,
          totalServiceFee: 1
        }
      },
      { $sort: { totalDeliveryFee: -1 } }
    ]);

    // Summary totals
    const summary = rows.reduce(
      (acc, row) => {
        acc.totalDeliveries += row.deliveriesCount;
        acc.totalDeliveryFee += row.totalDeliveryFee;
        acc.totalPrice += row.totalPrice ?? 0;
        acc.totalServiceFee += row.totalServiceFee ?? 0;
        return acc;
      },
      { totalDeliveries: 0, totalDeliveryFee: 0, totalPrice: 0, totalServiceFee: 0 }
    );

    reports[period.key] = {
      label: period.label,
      since,
      until: now,
      summary,
      rows
    };
  }

  res.status(200).json({
    success: true,
    data: reports
  });
});
