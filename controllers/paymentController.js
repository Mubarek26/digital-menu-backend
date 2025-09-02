const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const TEST_PAYMENT_SECRET = process.env.TEST_PAYMENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const RETURN_URL = process.env.RETURN_URL;
const Order=require('../models/Order')
exports.initializePayment = catchAsync(async (req, res, next) => {
  const { amount, currency, phone_number, orderId } = req.body;
  const tx_ref = `tx-${Date.now()}`;
  // Validate request data
  if (!amount || !currency || !phone_number || !tx_ref || !orderId) {
    return next(new appError("Missing required fields", 400));
  }
  const response = await fetch(
    "https://api.chapa.co/v1/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_PAYMENT_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        phone_number,
        tx_ref,
        callback_url: `${CALLBACK_URL}`,
        return_url: `${RETURN_URL}?tx_ref=${tx_ref}&order_id=${orderId}`,
        customization: {
          title: "My Shop Payment",
          description: "Payment for order",
        },
        meta: {
          hide_receipt: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return next(new appError(errorData.message, response.status));
  }
  const data = await response.json();
  res.status(200).json({
    status: "success",
    data,
  });
});

exports.callBack = catchAsync(async (req, res, next) => {
  const tx_ref =
    req.body?.tx_ref ||
    req.body?.txRef ||
    req.body?.tx_Ref ||
    req.query?.tx_ref ||
    req.query?.txRef ||
    req.params?.tx_ref;


  if (!tx_ref) {
    // reply 200 to acknowledge receipt but log error for later debugging
    console.warn('[Payment Callback] Missing tx_ref');
    return res.status(200).json({ status: 'error', message: 'Missing tx_ref' });
  }

  // Acknowledge callback
  res.status(200).json({ status: 'success', tx_ref });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
   const tx_ref =
    req.body?.tx_ref ||
    req.body?.txRef ||
    req.body?.tx_Ref ||
    req.query?.tx_ref ||
    req.query?.txRef ||
    req.params?.tx_ref;
  const orderId = req.body?.orderId;
  console.log("Payment Request Body:", req.body);

  if (!tx_ref) {
    return next(new appError("Missing required fields", 400));
  }
  const response = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TEST_PAYMENT_SECRET}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return next(new appError(errorData.message, response.status));
  }
  const updatedOrder = await Order.findOneAndUpdate(
  { orderId: orderId },
  { paymentStatus: "paid" },   // <-- new status
  { new: true }                 // returns updated doc
);
  const data = await response.json();
  res.status(200).json({
    status: "success",
    data,
    order: updatedOrder
  });
});
