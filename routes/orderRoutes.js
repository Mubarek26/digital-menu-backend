const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authController=require("../controllers/authController")
// Define routes for orders
router
  .route("/")
  .post(orderController.createOrder) // Create a new order
  .get(orderController.getAllOrders); // Get all orders

router.route("/update/:id").patch(orderController.updateOrderStatus); // Update an order by ID

router
  .route("/analytics/total-revenue")
  .get(orderController.getAllTotalRevenue); // Get total revenue from completed orders

router.route("/analytics/total-orders").get(orderController.getTotalOrders); // Get total revenue from completed orders

router
  .route("/analytics/top-selling-items")
  .get(orderController.getTopSellingItems); // Get top items sold
router
  .route("/analytics/active-customers")
  .get(orderController.activeCustomers); // Get top categories sold

router.route("/my-orders").get(authController.protect,orderController.getMyOrders)

  
module.exports = router; // Export the router for use in app.js
