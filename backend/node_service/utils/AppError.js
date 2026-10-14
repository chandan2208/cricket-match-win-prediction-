'use strict';

/**
 * Custom application error class.
 * Extends the native Error with HTTP status code and operational flag.
 * Operational errors are "expected" errors (e.g. validation failures, 404s)
 * vs programmer errors (bugs), allowing different handling strategies.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Capture clean stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Named factory helpers for common error types
AppError.badRequest = (msg) => new AppError(msg, 400);
AppError.unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401);
AppError.forbidden = (msg = 'Forbidden') => new AppError(msg, 403);
AppError.notFound = (msg = 'Resource not found') => new AppError(msg, 404);
AppError.conflict = (msg) => new AppError(msg, 409);
AppError.unprocessable = (msg) => new AppError(msg, 422);
AppError.tooManyRequests = (msg = 'Too many requests') => new AppError(msg, 429);
AppError.internal = (msg = 'Internal server error') => new AppError(msg, 500, false);
AppError.serviceUnavailable = (msg = 'Service unavailable') => new AppError(msg, 503);

module.exports = AppError;
