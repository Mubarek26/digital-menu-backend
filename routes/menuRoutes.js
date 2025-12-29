// const { router } = require("../app");
const express = require("express");
const router = express.Router();
const uploadImage = require("../middlewares/uploadImage");
const menuController = require("../controllers/menuController"); // Import menu controller
const authController = require("../controllers/authController");

// router.use(authController.protect); // Protect all routes after this middleware
// router.use(authController.restrictTo("admin","manager"));
router
  .route("/getByRestaurant")
  .get(authController.protect,menuController.getAllMenuItemsByRestaurant); // Get all menu items for a specific restaurant

router
  .route("/")
  .get(authController.protect, menuController.getAllMenuItems) // Get all menu items
  .post(
    uploadImage,
    authController.protect,
    authController.restrictTo("superadmin", "Manager",'Owner'),
    menuController.createMenuItem
  ); // Create a new menu item

 
  
router
  .route("/:id")
  .get(authController.protect, menuController.getMenuItem) // Get a specific menu item by ID
  .patch(
    uploadImage,
    authController.protect,
    authController.restrictTo("Admin", "Manager",'Owner'),
    menuController.updateMenuItem
  ) // Update a menu item by ID
  .delete(
    authController.protect,
    authController.restrictTo("Admin", "Manager",'Owner'),
    menuController.deleteMenuItem
  ); // Delete a menu item by ID

   router
  .route("/getrestaurantMenu/:restaurantId")
  .get(authController.protect, menuController.getMenuItemsByRestaurantId); // Get menu items by restaurant ID

module.exports = router; // Export the router for use in app.js
