const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
 tx_ref: {
    type: String,
    required: true
  },
  ref_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

async function saveTransactionToDatabase({ tx_ref, status, amount, currency = 'ETB', ref_id }) {
  try {
    const transaction = new Payment({
      tx_ref,
      status,
      amount,
      currency,
      ref_id
    });
    await transaction.save();
  } catch (error) {
    console.error("Error saving transaction to database:", error);
  }
}

module.exports = {  Payment, saveTransactionToDatabase};
