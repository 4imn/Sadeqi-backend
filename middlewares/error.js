const { ERRORS } = require('../config/constants');

// Not Found Error Handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific error types
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    return res.status(statusCode).json({
      success: false,
      error: 'Validation Error',
      message: 'Please provide all required fields',
      errors
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.error || ERRORS.INTERNAL_SERVER_ERROR,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

module.exports = { notFound, errorHandler };