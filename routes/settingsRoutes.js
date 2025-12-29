const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authController = require('../controllers/authController');
// Log when this route file is loaded (helps ensure it's required)
// console.log('routes/settingsRoutes.js loaded');

// Allow fetching and modifying settings. Some clients may POST to create settings,
// so map POST to the same controller which handles create-or-update logic.
router.route('/pricing').get(authController.protect, settingController.getPricingSettings);
router.route('/').get(authController.protect, settingController.getSettings).patch(authController.protect, settingController.updateSettings).post(authController.protect, settingController.updateSettings);

module.exports = router;