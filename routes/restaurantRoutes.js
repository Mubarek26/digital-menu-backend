const express = require("express");

const uploads = require("../middlewares/uploads");
const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  assignOwner,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurants,
} = require("../controllers/restaurantController");

const authcontroller = require("../controllers/authController");

const router = express.Router();

// Create & list restaurants
router
  .route("/")
  // Run uploads first to ensure multipart/form-data is parsed before auth middleware
  .post(uploads, authcontroller.protect, createRestaurant)  // Admin only
  .get(authcontroller.protect, getAllRestaurants);              // Public or authenticated

// Get, update, delete specific restaurant
router.route("/my")
.get(authcontroller.protect,getMyRestaurants);
router
  .route("/:id")
  .get(authcontroller.protect, getRestaurantById)
  // Allow updating images via multipart/form-data as well
  .put(uploads, authcontroller.protect, updateRestaurant)
  .delete(authcontroller.protect, deleteRestaurant);


// Get restaurants for authenticated owner

// Assign owner (admin only)
router.route("/:id/assignOwner").put(authcontroller.protect, assignOwner);

module.exports = router;
