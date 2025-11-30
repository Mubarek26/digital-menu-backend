const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/restaurants");
const fs = require("fs");
const path = require('path');
const exp = require("constants");
exports.getAllMenuItems = catchAsync(async (req, res, next) => {
  const menuItems = await MenuItem.find(); // Fetch all menu items from the database
  const fullUrl = req.protocol + "://" + req.get("host");
  const formattedItems = menuItems.map((item) => ({
    ...item._doc,
    // images are stored under uploads/foods, express serves the uploads folder at /images
    imageUrl: `${fullUrl}/images/foods/${item.image}`,
  }));

  if (!formattedItems) {
    return next(new appError("No menu items found", 404));
  }
  // Assuming the fetch was successful, send a response with the menu items
  res.status(200).json({
    status: "success",
    message: "All menu items retrieved successfully",
    data: {
      menuItems: formattedItems, // This should be replaced with actual data from the database
    },
  });
});

exports.getMenuItemsByRestaurantId = catchAsync(async (req, res, next) => {
  // restaurantId comes from the route param: /getrestaurant/:restaurantId
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) {
    return next(new appError('restaurantId is required', 400));
  }

  // Use find() to get all items for the restaurant (findOne returns a single doc)
  const menuItems = await MenuItem.find({ restaurantId });

  if (!menuItems || menuItems.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No menu items found for this restaurant',
      data: { menuItems: [] },
    });
  }

  const fullUrl = `${req.protocol}://${req.get('host')}`;
  const formattedItems = menuItems.map(item => ({
    ...item._doc,
    imageUrl: item.image ? `${fullUrl}/images/foods/${item.image}` : null,
  }));

  res.status(200).json({
    status: 'success',
    message: 'Menu items for the restaurant retrieved successfully',
    data: { menuItems: formattedItems },
  });
});


exports.getAllMenuItemsByRestaurant = catchAsync(async (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  let filter = {};

  if (role === 'owner') {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(200).json({
        status: 'success',
        message: 'No restaurant found for this owner',
        data: { menuItems: [] },
      });
    }
    filter.restaurantId = restaurant._id;
  }

  const menuItems = await MenuItem.find(filter).populate('restaurantId', 'name');

  if (!menuItems.length) {
    return res.status(200).json({
      status: 'success',
      message: 'No menu items found',
      data: { menuItems: [] },
    });
  }
  

  const fullUrl = `${req.protocol}://${req.get('host')}`;
  const formattedItems = menuItems.map(item => ({
    ...item._doc,
    imageUrl: item.image ? `${fullUrl}/images/foods/${item.image}` : null,
  }));

  res.status(200).json({
    status: 'success',
    message:
      role === 'owner'
        ? 'Your restaurant’s menu items retrieved successfully'
        : 'All menu items retrieved successfully',
    data: { menuItems: formattedItems },
  });
});



exports.createMenuItem = catchAsync(async (req, res, next) => {
  const { name, price, description, category,restaurantId } = req.body;
  const imagePath = req.file ? req.file.filename : null;
  // Fail early with a helpful error if restaurantId is missing — avoids Mongoose validation error
  if (!restaurantId) {
    return next(new appError('restaurantId is required to create a menu item', 400));
  }

  const newMenuItem = await MenuItem.create({
    name,
    price,
    description,
    category,
    image: imagePath,
    restaurantId
  }); // Assuming req.body contains the menu item data

  if (!newMenuItem) {
    return next(new appError("Failed to create menu item", 400));
  }
  // Assuming the creation was successful, send a response

  res.status(201).json({
    status: "success",
    message: "Menu item created successfully",
    data: {
      menuItem: newMenuItem, // This should be replaced with actual data from the database
    },
  });
});

exports.updateMenuItem = catchAsync(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id);

  if (!item) {
    return next(new appError("No menu item found with that ID", 404));
  }
  if (req.file) {
    const oldImagePath = path.join(__dirname, "../uploads/foods", item.image); // Store the old image path
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath); // Delete the old image file
    }
    item.image = req.file.filename; // Update the image path
    }
    
  // Update fields only when they are provided in the request body.
  if (typeof req.body.name !== 'undefined') item.name = req.body.name;
  if (typeof req.body.description !== 'undefined') item.description = req.body.description;
  if (typeof req.body.price !== 'undefined') item.price = req.body.price;
  if (typeof req.body.category !== 'undefined') item.category = req.body.category;
  if (typeof req.body.available !== 'undefined') item.isAvailable = req.body.available;

  // Determine restaurantId to assign:
  // - If the authenticated user is an Owner, force the restaurant to the owner's restaurant.
  // - Otherwise, if a restaurantId is supplied in the request body, accept it (for Admin/Manager flows).
  try {
    if (req.user && req.user.role === 'Owner') {
      const ownerRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
      if (!ownerRestaurant) {
        return next(new appError('No restaurant found for this owner', 404));
      }
      item.restaurantId = ownerRestaurant._id;
    } else if (typeof req.body.restaurantId !== 'undefined' && req.body.restaurantId) {
      item.restaurantId = req.body.restaurantId;
    }
  } catch (err) {
    return next(err);
  }

  await item.save(); // Save the updated item to the database

    // the full URL for the image
  const fullUrl = req.protocol + "://" + req.get("host");
  const updatedMenuItem = {
    ...item._doc,
    imageUrl: `${fullUrl}/images/foods/${item.image}`,
    };
    
  res.status(200).json({
    status: "success",
    message: "Menu item updated successfully",
    data: {
      menuItem: updatedMenuItem, // This should be replaced with actual data from the database
    },
  });
});

exports.deleteMenuItem = catchAsync(async (req, res, next) => {
  const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

  if (!deletedMenuItem) {
    return next(new appError("No menu item found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    message: "Menu item deleted successfully",
    data: null, // No content to return for deletion
  });
});

exports.getMenuItem = catchAsync(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (!menuItem) {
    return next(new appError("No menu item found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Menu item retrieved successfully",
    data: {
      menuItem: menuItem, // This should be replaced with actual data from the database
    },
  });
});
