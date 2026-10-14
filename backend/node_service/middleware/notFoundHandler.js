'use strict';

const AppError = require('../utils/AppError');

// 404 handler — catches all unmatched routes
const notFoundHandler = (req, res, next) => {
  return next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundHandler;
