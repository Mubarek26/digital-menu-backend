// models/Discount.js
const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  title: { type: String, required: true },          // e.g. "Eid Holiday Discount"
  description: { type: String, default: "" },       // e.g. "20% off all orders"
  discount_type: { type: String, enum: ["percent", "flat"], default: "percent" },
  discount_value: { type: Number, required: true }, // 0.2 = 20% OR 50 = 50 ETB
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  active: { type: Boolean, default: true },
  apply_to: { type: String, enum: ["all", "delivery", "dine_in", "takeaway"], default: "all" }
}, { timestamps: true });

module.exports = mongoose.model("Discount", discountSchema);
