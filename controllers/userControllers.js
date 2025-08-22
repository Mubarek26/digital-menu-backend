const express = require('express');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // Import the handler factory
const User = require('../models/UserModel');
// const { use } = require('react');
const router = express.Router();
// const fs = require('fs');


exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // Set the user ID to the authenticated user's ID
  next(); // Call the next middleware function
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400
      )
    );
  }
  // 2. Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = ['name', 'email', 'photo', 'role']; // Add any other fields
  Object.keys(req.body).forEach((el) => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // 3. update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // return the updated document
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser: updatedUser,
    },
  });
});



exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});


exports.getAllUsers = factory.getAll(User); // Use the getAll factory function to get all users
exports.getUser = factory.getOne(User); // Use the getOne factory function to get a user
exports.updateUsers = factory.updateOne(User); // Use the updateOne factory function to handle updates
exports.deleteUsers = factory.deleteOne(User); // Use the deleteOne factory function to handle deletion

