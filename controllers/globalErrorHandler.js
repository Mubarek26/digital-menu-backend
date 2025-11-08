const app = require("../app");
const AppError = require("../utils/appError");

const handleDuplicateError = (err) => {
  const message = `Duplicate field value:`;
  return new AppError(message, 400);
};
const sendErrorProd = (err, res) => {
  // let error={...err}
  // if (res.headersSent) {
  //   // If headers are already sent, do not try to send another response
  //   return;
  // }
  if (err.isOperational) {
     res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "something went wrong",
      err: err,
    });
  }
};

const sendErrorDev = (err, res) => {
  if (res.headersSent) {
    // If headers are already sent, do not try to send another response
    return;
  }
  res.status(err.statusCode || 500).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
    err: err,
  });
};

module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.error("Error:", err.message); // Log the error message
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") {
      err = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      error = handleDuplicateError(error);
    }
    if (err.name === "ValidationError") {
      err = handleValidationError(err);
    }
    if (err.name === "JsonWebTokenError") {
      err = handlJsonWebTokenError(err);
    }
    if (err.name === "TokenExpiredError") {
      const message = "Your token has expired! Please log in again.";
      err = new AppError(message, 401);
    }
    // if (res.headersSent) {
    //   // If headers are already sent, do not try to send another response
    //   return;
    // }
    // if (err.isOperational) {
    //   return res.status(err.statusCode).json({
    //     status: err.status,
    //     statusCode: err.statusCode,
    //     message: err.message,
    //   });
    // }
    sendErrorProd(error, res);
  }
};
