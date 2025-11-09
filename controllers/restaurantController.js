

const Restaurant = require("../models/restaurants");
const fs = require("fs");
const path = require("path");

/**
 * 🏠 CREATE a restaurant (admin only)
 */
const createRestaurant = async (req, res) => {
  try {
    // Build payload from body and attach uploaded file names if present
    const payload = { ...req.body };

    // Normalize single-element arrays (multer may supply fields as arrays)
    Object.keys(payload).forEach((k) => {
      if (Array.isArray(payload[k]) && payload[k].length === 1) payload[k] = payload[k][0];
    });

    // tags may come as a comma-separated string from the client
    if (payload.tags && typeof payload.tags === "string") {
      payload.tags = payload.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Map flat contact fields from the client to the nested schema shape
    // (frontend may submit contactEmail / contactPhone)
    if (payload.contactEmail || payload.contactPhone) {
      payload.contact = payload.contact || {};
      if (payload.contactEmail) {
        payload.contact.email = payload.contactEmail;
        delete payload.contactEmail;
      }
      if (payload.contactPhone) {
        payload.contact.phone = payload.contactPhone;
        delete payload.contactPhone;
      }
    }

    // Basic validation: ensure name exists
    if (!payload.name || (typeof payload.name === 'string' && payload.name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
        receivedBodyKeys: Object.keys(req.body),
        files: req.files ? Object.keys(req.files) : [],
        contentType: req.headers['content-type'] || null,
        cookies: req.cookies || null
      });
    }

    // If files were uploaded via the uploads middleware, attach filenames
    if (req.files) {
      payload.images = payload.images || {};
      if (req.files.logo && req.files.logo[0]) payload.images.logo = req.files.logo[0].filename;
      if (req.files.banner && req.files.banner[0]) payload.images.banner = req.files.banner[0].filename;
    }

    // coordinates might be sent as longitude/latitude fields
    if (payload.longitude && payload.latitude) {
      payload.address = payload.address || {};
      payload.address.coordinates = {
        type: "Point",
        coordinates: [parseFloat(payload.longitude), parseFloat(payload.latitude)],
      };
      // remove raw fields to avoid schema mismatch
      delete payload.longitude;
      delete payload.latitude;
    }

    const restaurant = await Restaurant.create(payload);
    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      restaurant,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * 🍽️ GET all restaurants
 */
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("ownerId", "name email");
    res.status(200).json({ success: true, restaurants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 🔍 GET single restaurant by ID
 */
const getRestaurantById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant ID' });
    }
    const restaurant = await Restaurant.findById(req.params.id).populate("ownerId", "name email");
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({ success: true, restaurant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 👑 ASSIGN owner to a restaurant (admin only)
 */
const assignOwner = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ success: false, message: "Only Manager can assign owners" });
    }

    const { ownerId } = req.body;
    if (!ownerId) {
      return res.status(400).json({ success: false, message: "ownerId is required" });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant ID' });
    }
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (restaurant.ownerId) {
      return res.status(400).json({ success: false, message: "Restaurant already has an owner" });
    }

    restaurant.ownerId = ownerId;
    restaurant.status = "active"; // optional: activate when assigned
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Owner assigned successfully",
      restaurant,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ✏️ UPDATE restaurant (owner or admin)
 */
const updateRestaurant = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant ID' });
    }
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    if (
      // restaurant.ownerId?.toString() !== req.user._id.toString() &&
      req.user.role !== "Manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this restaurant",
      });
    }

    // Handle uploaded files: delete old and set new filenames
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const oldLogo = restaurant.images?.logo;
        if (oldLogo) {
          const oldPath = path.join(__dirname, "../uploads/restaurants", oldLogo);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        restaurant.images = restaurant.images || {};
        restaurant.images.logo = req.files.logo[0].filename;
      }
      if (req.files.banner && req.files.banner[0]) {
        const oldBanner = restaurant.images?.banner;
        if (oldBanner) {
          const oldPath = path.join(__dirname, "../uploads/restaurants", oldBanner);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        restaurant.images = restaurant.images || {};
        restaurant.images.banner = req.files.banner[0].filename;
      }
    }

    // Merge other fields from body
    // If tags sent as string, convert to array
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // If longitude/latitude provided, update coordinates
    if (req.body.longitude && req.body.latitude) {
      restaurant.address = restaurant.address || {};
      restaurant.address.coordinates = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    // Map flat contact fields when updating (support contactEmail/contactPhone)
    if (req.body.contactEmail || req.body.contactPhone) {
      restaurant.contact = restaurant.contact || {};
      if (req.body.contactEmail) restaurant.contact.email = req.body.contactEmail;
      if (req.body.contactPhone) restaurant.contact.phone = req.body.contactPhone;
    }

    // Apply remaining body fields
    Object.keys(req.body).forEach((key) => {
      if (["longitude", "latitude"].includes(key)) return;
      // simple shallow assign for top-level fields; nested fields may require more handling
      restaurant[key] = req.body[key];
    });

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ❌ DELETE restaurant (admin only)
 */
const deleteRestaurant = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete restaurants",
      });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant ID' });
    }
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found" });

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 🧑‍💼 GET restaurants for authenticated owner
 */
const getMyRestaurants = async (req, res) => {
  try {
    // Only allow owners
    if (!req.user || req.user.role !== "Owner") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const restaurants = await Restaurant.find({ ownerId: req.user._id }).populate("ownerId", "name email");
    res.status(200).json({ success: true, restaurants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  assignOwner,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurants,
};
