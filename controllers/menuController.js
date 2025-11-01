const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const MenuItem = require("../models/MenuItem");
const fs = require("fs");
const path = require('path');
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

exports.createMenuItem = catchAsync(async (req, res, next) => {
  const { name, price, description, category } = req.body;
  const imagePath = req.file ? req.file.filename : null;
  const newMenuItem = await MenuItem.create({
    name,
    price,
    description,
    category,
    image: imagePath,
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
    
  if (req.body.name) item.name = req.body.name;
  if (req.body.description) item.description = req.body.description;
  if (req.body.price) item.price = req.body.price;
  if (req.body.category) item.category = req.body.category;
  if (req.body.available) item.isAvailable = req.body.available;
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
