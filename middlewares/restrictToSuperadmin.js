const AppError = require('../utils/appError'); // adjust path

const restrictToSuperadmin = (req, res, next) => {
  if (req.user.role?.toLowerCase() !== "superadmin") {
    return next(new AppError("Access denied. Only superadmins can access this route.", 403));
  }
  next();
};

module.exports = restrictToSuperadmin;
