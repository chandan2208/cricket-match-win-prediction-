'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Global error handler middleware.
 * Converts all error types to structured JSON responses.
 * Never exposes stack traces or internal details in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation error';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose CastError (invalid ObjectId) ────────────────────────────────
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value '${err.value}' for field '${err.path}'`;
  }

  // ── MongoDB Duplicate Key ─────────────────────────────────────────────────
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for field: ${field}`;
  }

  // ── JSON Parse Error ──────────────────────────────────────────────────────
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  }

  // ── Payload Too Large ────────────────────────────────────────────────────
  else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log all 5xx errors
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    });
  } else {
    logger.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
  }

  const errors = details || (
    process.env.NODE_ENV === 'development' && err.stack
      ? [{ message: err.stack }]
      : null
  );

  return errorResponse(res, message, statusCode, errors);
};

module.exports = errorHandler;
