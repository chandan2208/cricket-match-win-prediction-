'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Attaches a unique requestId to each request and logs entry/exit.
 */
const requestLogger = (req, res, next) => {
  req.id = uuidv4();
  req.startTime = Date.now();

  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

module.exports = requestLogger;
