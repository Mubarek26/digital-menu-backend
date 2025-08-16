const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    // required: true, // you can remove this if not using table numbers
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true,
      },
      name: {
        type: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],

  notes: {
    type: String, // optional customer note (e.g., "no onions")
  },

  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "completed", "cancelled"],
    default: "pending",
  },
  phoneNumber: {
    type: String,
    required: true, // phone number is required for contact
  },
  orderType: {
    type: String,
    enum: ["Dine-In", "Takeaway", "Delivery"],
    default: "Dine-In", // default to dine-in
  },
  totalPrice: {
    type: Number,
    required: true, // total price of the order
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "failed"],
    default: "unpaid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      // required: true,
    },
    coordinates: {
      type: [Number],
      // required: true,
    },
  },
});

module.exports = mongoose.model("Order", orderSchema);
