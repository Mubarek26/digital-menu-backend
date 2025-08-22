const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../utils/appError'); // Import AppError for error handling
const validator = require('validator'); // Import validator for email validation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  status: {
    type: String,
    // enum: ['active', 'inactive'],
    default: 'available',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE
      validator: function (el) {
        return el === this.password; // Check if passwordConfirm matches password
      },
      message: 'Passwords are not the same!',
    },
  },
  role: {
    type: String,
    enum: ['Waiter', 'Delivery', 'Admin', 'Manager'],
    default: 'Waiter',
  },
  phoneNumber: {
    type: Number,
    required: [true, 'A user must have a phone number'],
    // validate: {
    //   validator: function (v) {
    //     return /^\d{9}$/.test(v);
    //   },
    //   message: 'Please provide a valid phone number!',
    // },
  },
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, // Exclude from queries by default
  },
  last_assigned_at: { type: Date, default: new Date(0) },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next(); // Proceed to the next middleware
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now()-1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    
    console.log('🔍 JWT issued at:', JWTTimestamp);
    console.log('🔍 Password changed at:', changedTimestamp);
    console.log('🔍 Changed after?', JWTTimestamp < changedTimestamp);
    return JWTTimestamp < changedTimestamp; // Return true if password was changed after the token was issued
  }
  return false; // If no passwordChangedAt, return false
};


userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random token
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); // Hash the token before saving it
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Set expiration time for the token (10 minutes)
  console.log({ resetToken }, this.resetPasswordToken);
  return resetToken;
};


// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } }); // Exclude inactive users from all queries
//   next(); // Proceed to the next middleware
// });

const User = mongoose.model('User', userSchema); // Create the User model from the schema
module.exports = User; // Export the User model for use in other modules
