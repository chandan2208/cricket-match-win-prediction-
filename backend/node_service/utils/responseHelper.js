'use strict';

/**
 * Standardized API response helpers.
 * All responses follow: { success, message, data, meta }
 */

const successResponse = (res, data = {}, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const createdResponse = (res, data = {}, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  return errorResponse(res, message, 400, errors);
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  return successResponse(res, data, message, 200, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

// Backward-compatible aliases for existing call sites.
const sendSuccess = successResponse;
const sendCreated = createdResponse;
const sendError = errorResponse;
const sendNotFound = notFoundResponse;
const sendBadRequest = badRequestResponse;
const sendUnauthorized = unauthorizedResponse;
const sendPaginated = paginatedResponse;

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  paginatedResponse,
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendPaginated,
};
