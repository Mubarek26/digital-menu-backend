const express = require("express");
const { getTotalOrders, getCompletedOrdersCount, getCancelledOrdersCount, getTotalRevenue, getWeightedActiveUsers, getTopOrderedItemsByName, getDailySalesOverview, getTopRestaurants, getOrdersDistribution } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/total-orders", getTotalOrders);
router.get("/completed-orders", getCompletedOrdersCount);
router.get("/cancelled-orders", getCancelledOrdersCount);
router.get("/total-revenue", getTotalRevenue);
router.get("/active-users", getWeightedActiveUsers);
router.get("/top-ordered-items", getTopOrderedItemsByName);
router.get("/sales-overview", getDailySalesOverview);
router.get("/top-restaurants", getTopRestaurants);
router.get("/orders-distribution", getOrdersDistribution)



module.exports = router;
