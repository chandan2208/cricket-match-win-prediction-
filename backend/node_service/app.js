'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const predictionRoutes = require('./routes/prediction.routes');
const matchRoutes = require('./routes/match.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const teamRoutes = require('./routes/team.routes');
const playerRoutes = require('./routes/player.routes');

const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const { successResponse, errorResponse } = require('./utils/responseHelper');

const app = express();

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    errorResponse(res, 'Too many requests, please try again later.', 429),
});

const predictionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (req, res) =>
    errorResponse(res, 'Too many prediction requests per minute.', 429),
});

app.use(globalLimiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request Debug Logging ────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log('[debug] incoming method:', req.method);
  console.log('[debug] request body:', req.body);
  next();
});

// ── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.url === '/health',
}));
app.use(requestLogger);

// ── Health Check (no auth needed) ───────────────────────────────────────────
app.get('/health', (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    service: 'Cricket Prediction API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 'Health check successful');
});

// ── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = process.env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/predictions`, predictionLimiter, predictionRoutes);
app.use(`${API_PREFIX}/matches`, matchRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/teams`, teamRoutes);
app.use(`${API_PREFIX}/players`, playerRoutes);

// ── Swagger Documentation ────────────────────────────────────────────────────
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Cricket Prediction API',
}));

// ── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
