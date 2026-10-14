'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT) || 30000;
const ML_MAX_RETRIES = 1;

// Create a dedicated axios instance for ML service communication
const mlClient = axios.create({
  baseURL: ML_BASE_URL,
  timeout: ML_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Name': 'cricket-node-api',
  },
});

// Request interceptor: log outbound ML requests
mlClient.interceptors.request.use((config) => {
  logger.info(`[ML Service] → ${config.method.toUpperCase()} ${config.url}`, {
    data: config.data,
  });
  return config;
});

// Response interceptor: log responses
mlClient.interceptors.response.use(
  (response) => {
    logger.info(`[ML Service] ← ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.detail || error.message;
    logger.error(`[ML Service] Error ${status}: ${msg}`);
    return Promise.reject(error);
  }
);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const sigmoid = (x) => 1 / (1 + Math.exp(-x * 5));

const buildFallbackPrediction = (payload, reason) => {
  const features = payload?.features || {};

  const raw =
    toNumber(features.strength_diff) * 0.30 +
    toNumber(features.form_diff) * 0.20 +
    (toNumber(features.h2h_ratio_a, 0.5) - 0.5) * 0.15 +
    toNumber(features.venue_advantage_diff) * 0.15 +
    (toNumber(features.toss_advantage_a, 0.5) - 0.5) * 0.10 +
    (toNumber(features.icc_ranking_a_t20) - toNumber(features.icc_ranking_b_t20)) * 0.10;

  const teamAWinProb = clamp(sigmoid(raw), 0.05, 0.95);
  const teamBWinProb = parseFloat((1 - teamAWinProb).toFixed(4));

  logger.warn('[ML Service] Falling back to local sigmoid approximation', { reason });

  return {
    success: true,
    data: {
      win_probability: parseFloat(teamAWinProb.toFixed(4)),
      key_factors: [],
    },
    error: null,
    meta: {
      source: 'fallback',
      teamA_win_prob: parseFloat(teamAWinProb.toFixed(4)),
      teamB_win_prob: teamBWinProb,
      key_factors: [],
      model_version: 'fallback-1.0.0',
      fallback_reason: reason,
    },
  };
};

const normalizeSuccessResponse = (mlData) => {
  const teamAWinProb = clamp(toNumber(mlData?.team_a_win_prob, 0.5), 0.05, 0.95);
  const teamBWinProb = clamp(toNumber(mlData?.team_b_win_prob, 1 - teamAWinProb), 0.05, 0.95);

  return {
    success: true,
    data: {
      win_probability: parseFloat(teamAWinProb.toFixed(4)),
      key_factors: Array.isArray(mlData?.key_factors) ? mlData.key_factors : [],
    },
    error: null,
    meta: {
      source: 'ml_service',
      teamA_win_prob: parseFloat(teamAWinProb.toFixed(4)),
      teamB_win_prob: parseFloat(teamBWinProb.toFixed(4)),
      key_factors: Array.isArray(mlData?.key_factors) ? mlData.key_factors : [],
      model_version: mlData?.model_version || '1.0.0',
    },
  };
};

const postPredictWithRetry = async (payload) => {
  let lastError;

  for (let attempt = 0; attempt <= ML_MAX_RETRIES; attempt += 1) {
    try {
      const { data } = await mlClient.post('/predict', payload);
      return normalizeSuccessResponse(data);
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.message;
      logger.error(
        `[ML Service] Predict attempt ${attempt + 1}/${ML_MAX_RETRIES + 1} failed`,
        { status, detail }
      );

      // Validation errors should not be retried.
      if (status === 422) break;

      if (attempt < ML_MAX_RETRIES) {
        logger.warn('[ML Service] Retrying /predict request once');
      }
    }
  }

  throw lastError;
};

/**
 * Send features to the ML service and receive win probabilities.
 * @param {Object} features - Engineered features for the model
 * @returns {Object} - { teamA_win_prob, teamB_win_prob, key_factors, model_version }
 */
const getPrediction = async (features) => {
  try {
    return await postPredictWithRetry(features);
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;

    if (status === 422) {
      logger.error('[ML Service] Invalid payload for /predict; using fallback approximation', { detail });
      return buildFallbackPrediction(features, `Invalid payload: ${detail}`);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.error('[ML Service] ML endpoint unreachable; using fallback approximation', { detail });
      return buildFallbackPrediction(features, 'ML service unreachable');
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      logger.error('[ML Service] ML endpoint timed out; using fallback approximation', { detail });
      return buildFallbackPrediction(features, 'ML service timeout');
    }

    logger.error('[ML Service] Unexpected ML failure; using fallback approximation', {
      status,
      detail,
      code: error.code,
    });
    return buildFallbackPrediction(features, detail || 'Unexpected ML service error');
  }
};

/**
 * Health check for the ML microservice
 */
const checkMLHealth = async () => {
  try {
    const { data } = await mlClient.get('/health');
    return { online: true, ...data };
  } catch {
    return { online: false, status: 'unreachable' };
  }
};

/**
 * Fetch model metadata (version, training date, accuracy)
 */
const getModelInfo = async () => {
  try {
    const { data } = await mlClient.get('/model/info');
    return data;
  } catch {
    return null;
  }
};

module.exports = { getPrediction, checkMLHealth, getModelInfo };
