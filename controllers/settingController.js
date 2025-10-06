const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Setting = require("../models/Setting");

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
            data: { settings },
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