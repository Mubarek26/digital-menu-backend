const express = require("express");
const { getDashboardStats, getTopOrderedItemsByName, getSalesOverview, getTopRestaurants, getOrdersDistribution, getRestaurantsNames, getRestaurantName, getOwnerRestaurant, getRecentPendingOrders } = require("../controllers/analyticsController");

const authController = require("../controllers/authController");
const restrictToRoles = require("../middlewares/restrictToRoles");
const restrictToSuperadmin = require("../middlewares/restrictToSuperadmin");

const router = express.Router();

router.get("/overview", authController.protect, restrictToRoles, getDashboardStats);
router.get("/top-ordered-items", authController.protect, restrictToRoles, getTopOrderedItemsByName);
router.get("/sales-overview", authController.protect, restrictToRoles, getSalesOverview);
router.get("/top-restaurants", authController.protect, restrictToSuperadmin , getTopRestaurants);
router.get("/orders-distribution", authController.protect, restrictToRoles, getOrdersDistribution);
router.get("/restaurant-names", authController.protect, restrictToSuperadmin, getRestaurantsNames);
router.get("/restaurant-name", authController.protect, getRestaurantName);
router.get("/owner-restaurant", restrictToRoles, getOwnerRestaurant);
router.get("/recent-pending-orders", authController.protect, restrictToRoles, getRecentPendingOrders);


module.exports = router;
