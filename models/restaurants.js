const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    // 🏷️ Basic Info
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    tags: [{ type: String }], // e.g. ["Ethiopian", "Halal", "Fast Food"]

    // 👤 Ownership (linked later)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // can be null until owner claims
      default: null
    },

    // 📞 Contact Info
    contact: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true }
    },

    // 📍 Address & Location
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, default: "Ethiopia" },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere"
        }
      }
    },

    // 🕓 Operating Schedule
    schedule: {
      openingTime: { type: String, default: "08:00" },
      closingTime: { type: String, default: "22:00" },
      isOpen: { type: Boolean, default: true }
    },

    // ⭐ Ratings
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 }
    },

    // 🚚 Delivery Settings
    delivery: {
      fee: { type: Number, default: 0 },
      minOrder: { type: Number, default: 0 },
      estimatedTime: { type: String, default: "30-45 mins" }
    },

    // 🖼️ Media
    images: {
      logo: { type: String },
      banner: { type: String }
    },

    // 📜 Restaurant Status
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "closed"],
      default: "pending"
    }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// ✅ Index for geospatial queries (nearby restaurants)
restaurantSchema.index({ "address.coordinates": "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);
