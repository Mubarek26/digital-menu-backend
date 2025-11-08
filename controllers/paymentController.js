const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const TEST_PAYMENT_SECRET = process.env.TEST_PAYMENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const RETURN_URL = process.env.RETURN_URL;
const {saveTransactionToDatabase}  = require("../models/Transaction");
const axios = require("axios");
const Order = require("../models/Order");
// const saveTransactionToDatabase =
//   (TransactionModule && TransactionModule.saveTransactionToDatabase) ||
//   (typeof TransactionModule === "function" ? TransactionModule : null);
exports.initializePayment = catchAsync(async (req, res, next) => {
  const { amount, currency, phone_number, orderId } = req.body;
   const tx_ref = `tx_${orderId ? String(orderId) : Date.now()}`;
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
  console.log("Payment Callback Request Body:", req.body);
  const { ref_id, trx_ref } = req.body;

  if (!trx_ref) {
    console.warn("[payment callback] missing trx_ref");
    return res.status(400).send("Missing trx_ref");
  }
  const orderId = trx_ref.split("_")[1];
  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${TEST_PAYMENT_SECRET}`,
        },
      }
    );
    console.log("Chapa Verification Response:", response.data);
    if (response.data.status === "success") {
      // Store transaction details in your database
      await saveTransactionToDatabase({ tx_ref: trx_ref, status: response.data.status, amount: response.data.data.amount, ref_id });
      await Order.findOneAndUpdate(
        { orderId: orderId },
        { paymentStatus: "paid" }, // <-- new status
        { new: true } // returns updated doc
      );
      
      res.status(200).send("Webhook received");
    } else {
      res.status(400).send("Transaction verification failed");
    }
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Server error");
  }
  // Acknowledge callback
  // res.status(200).json({ status: 'success', tx_ref });
});


exports.verifyPayment = catchAsync(async (req, res, next) => {
  const trx_ref =
    req.body?.tx_ref ||
    req.body?.tx_Ref ||
    req.query?.tx_ref ||
    req.params?.tx_ref;
  console.log("Payment Request Body:", req.body);

  if (!trx_ref) {
    return next(new appError("Missing required fields", 400));
  }
  const response = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${trx_ref}`,
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
  const data = await response.json();
  res.status(200).json({
    status: "success",
    data,
  });
});
