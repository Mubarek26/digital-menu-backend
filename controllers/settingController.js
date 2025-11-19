const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Setting = require("../models/Setting");

const toNumberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Get current settings
exports.getSettings = catchAsync(async (req, res, next) => {
  let settings = await Setting.findOne();
    res.status(200).json({
      status: "success",
      message: "Settings retrieved successfully",
        data: {
            settings,
        }
      })
  
})

exports.updateSettings = catchAsync(async (req, res, next) => {

    let settings = await Setting.findOne(); // Get existing settings
    if (!settings) {
        settings = await Setting.create(req.body); // Create new settings if none exist
        res.status(201).json({
            status: "success",
            message: "Settings created successfully",
            data: { settings }
        });
    } else {
       
        settings = await Setting.findOneAndUpdate({}, req.body, {
            new: true,
            runValidators: true,
        });

        // Send updated settings in the response
        res.status(200).json({
            status: 'success',
            message: 'Settings updated successfully',
            data: { settings },
        });
    }

})

exports.getPricingSettings = catchAsync(async (req, res, next) => {
  const settings = await Setting.findOne().lean();

  res.status(200).json({
    status: "success",
    message: "Pricing settings retrieved successfully",
    data: {
      delivery_fee: toNumberOr(settings?.delivery_fee, 0),
      delivery_per_km_rate: toNumberOr(settings?.delivery_per_km_rate, 0),
      max_delivery_distance_km:
        settings?.max_delivery_distance_km === null ||
        settings?.max_delivery_distance_km === undefined
          ? null
          : toNumberOr(settings.max_delivery_distance_km, null),
      service_fee: toNumberOr(settings?.service_fee, 0),
    },
  });
});