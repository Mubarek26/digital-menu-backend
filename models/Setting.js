// models/Setting.js
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  dine_in: { type: Boolean, default: true },
  takeaway: { type: Boolean, default: true },
  delivery: { type: Boolean, default: true },
});

const daySchema = new mongoose.Schema({
  open: { type: String, default: null }, // "09:00"
  close: { type: String, default: null }, // "22:00"
  closed: { type: Boolean, default: false },
});



const settingSchema = new mongoose.Schema(
  {
    services: { type: serviceSchema, default: () => ({}) },
    operating_hours: {
      monday: {
        type: daySchema,
        default: () => ({ open: "09:00", close: "22:00", closed: false }),
      },
      tuesday: {
        type: daySchema,
        default: () => ({ open: "09:00", close: "22:00", closed: false }),
      },
      wednesday: {
        type: daySchema,
        default: () => ({ open: "09:00", close: "22:00", closed: false }),
      },
      thursday: {
        type: daySchema,
        default: () => ({ open: "09:00", close: "22:00", closed: false }),
      },
      friday: {
        type: daySchema,
        default: () => ({ open: "09:00", close: "23:00", closed: false }),
      },
      saturday: {
        type: daySchema,
        default: () => ({ open: "10:00", close: "23:00", closed: false }),
      },
      sunday: { type: daySchema, default: () => ({ closed: true }) },
    },
    max_tables: { type: Number, default: 30 },
    is_open: { type: Boolean, default: true }, // manual override
    currency: { type: String, default: "ETB" },
    min_order_amount: { type: Number, default: 100 },
    delivery_fee: { type: Number, default: 50 },
    tax_rate: { type: Number, default: 0.15 },

    payment_methods: {
      cash: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      mobile_money: { type: Boolean, default: false },
        },
    
    reservation_enabled: { type: Boolean, default: true },

    special_notice: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
