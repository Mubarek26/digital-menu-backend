// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },         // "Holiday Discount" / "Restaurant Closed"
  message: { type: String, required: true },       // full text for SMS/app notification
  type: { type: String, enum: ["discount", "announcement", "system"], default: "announcement" },
  send_sms: { type: Boolean, default: false },     // override per notification
  discount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount",
    default: null
  },                                               // optional link to a Discount
  start_date: { type: Date, default: Date.now },   // when to show/send
  end_date: { type: Date, default: null },         // optional expiry
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
