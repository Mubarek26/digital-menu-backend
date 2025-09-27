// models/Promotion.js
const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Eid Holiday Discount"
    description: { type: String, default: "" }, // e.g., "20% off all delivery orders"
    type: {
      type: String,
      enum: ["discount", "announcement"],
      default: "announcement",
    },
    discount_type: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    }, // only used if type === 'discount'
    discount_value: { type: Number, default: 0 }, // 0.2 = 20% OR 50 = 50 ETB
    apply_to: {
      type: String,
      enum: ["all", "delivery", "dine_in", "takeaway"],
      default: "all",
    }, // only for discounts
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    active: { type: Boolean, default: true },
    send_sms: { type: Boolean, default: false }, // send SMS to users if allowed in Setting
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
