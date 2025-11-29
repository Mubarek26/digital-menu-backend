const express = require("express");
const { getDashboardStats, getTopOrderedItemsByName, getSalesOverview, getTopRestaurants, getOrdersDistribution, getRestaurantNames } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/overview", getDashboardStats);
router.get("/top-ordered-items", getTopOrderedItemsByName);
router.get("/sales-overview", getSalesOverview);
router.get("/top-restaurants", getTopRestaurants);
router.get("/orders-distribution", getOrdersDistribution);
router.get("/restaurant-names", getRestaurantNames);



module.exports = router;
