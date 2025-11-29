const mongoose = require("mongoose");
const { stripLow } = require("validator");

const orderSchema = new mongoose.Schema({
  orderId: String,
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
    enum: ["pending", "preparing", "ready", "completed","accepted", "cancelled"],
    default: "pending",
  },
  phoneNumber: {
    type: String,
    required: true, // phone number is required for contact
  },
  alternatePhoneNumber: {
    type: String,
    default: null, // optional alternate phone number
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
  subtotal: {
    type: Number,
    default: 0,
    min: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0, // default delivery fee is 0
    min: 0,
  },
  serviceFee: {
    type: Number,
    default: 0, // default service fee is 0
    min: 0,
  },
  deliveryDistanceKm: {
    type: Number,
    min: 0,
    default: null,
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
  assignedEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null, // ID of the employee assigned to this order
    ref: "User", // Assuming you have a User model for employees
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  restaurantConfirmed: {
    type: Boolean,
    default: false,
  },
    address: {
      type: String,
      // required: true,
    },
  
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
  
    coordinates: {
      type: [Number],
      // required: true,
    },
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
