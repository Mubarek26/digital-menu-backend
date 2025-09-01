const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
// Define your payment routes here

router.route('/initializePayment').post(paymentController.initializePayment);
router.route('/verifyPayment').post(paymentController.verifyPayment);
router.route('/callback').post(paymentController.callBack);
module.exports = router;