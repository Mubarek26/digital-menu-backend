const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
// Define your payment routes here

router.route('/initializePayment').post(paymentController.initializePayment);
router.route('/verifyPayment').post(paymentController.verifyPayment);
// Accept both POST and GET for the callback endpoint because some payment gateways
// may call the webhook with either method (or redirect the user to return_url via GET).
router.route('/callback').get(paymentController.callBack).post(paymentController.callBack);
module.exports = router;