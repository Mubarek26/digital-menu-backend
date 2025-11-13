const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");
// Define routes for orders
router
  .route("/")
  .post(orderController.createOrder) // Create a new order
  .get(authController.protect, orderController.getAllOrders); // Get all orders
// get recent orders
router.route("/recent-orders").post(orderController.getRecentOrders); // Get recent orders for a restaurant

router.route("/confirmOrder/:orderId").patch(orderController.confirmOrder); // Restaurant confirms the order
router.route("/update/:id").patch(orderController.updateOrderStatus);
router.route("/getOrder/:id").get(orderController.getOrderById); // Get an order by ID

router
  .route("/analytics/total-revenue/:restaurantId")
  .get(authController.protect, orderController.getAllTotalRevenue); // Get total revenue from completed orders

router
  .route("/analytics/total-orders/:restaurantId")
  .get(orderController.getTotalOrders); // Get total revenue from completed orders

router
  .route("/analytics/top-selling-items")
  .get(orderController.getTopSellingItems); // Get top items sold
router
  .route("/analytics/active-customers")
  .get(orderController.activeCustomers); // Get top categories sold

router
  .route("/my-orders")
  .get(authController.protect, orderController.getMyOrders);

module.exports = router; // Export the router for use in app.js
