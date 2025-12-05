const express = require("express");
const deliveryController = require("../controllers/deliveryController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/report").get(
    authController.protect,
	deliveryController.getDeliveryEarnings
);

module.exports = router;
