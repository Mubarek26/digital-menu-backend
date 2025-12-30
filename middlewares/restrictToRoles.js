const AppError = require('../utils/appError'); 
const catchAsync = require('../utils/catchAsync');
const Restaurant = require('../models/restaurants');

// normalize roles
const normalizeRole = (role) => {
  
  if (!role) return "";
  return role.trim().toLowerCase();
};

const restrictToRoles = catchAsync(async (req, res, next) => {
  const role = normalizeRole(req.user.role);

  if (role === "superadmin" || role === "manager") {
    // superadmin and manager → no restriction
    return next();
  }

  if (role === "owner") {
    // owner → fetch their single restaurant
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id }, { _id: 1 });
    if (!restaurant) {
      return next(new AppError("No restaurant assigned to this owner", 404));
    }

    req.ownerRestaurantId = restaurant._id; // single ID
    return next();
  }

  // any other role → forbidden
  return next(new AppError("Unauthorized role", 403));
});

module.exports = restrictToRoles;
