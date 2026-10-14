'use strict';

const { validationResult } = require('express-validator');
const { createPrediction, resolvePrediction, getAccuracyStats } = require('../services/predictionService');
const Prediction = require('../models/Prediction');
const { sendSuccess, sendCreated, sendBadRequest, sendPaginated, sendNotFound } = require('../utils/responseHelper');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * POST /api/v1/predict
 * Create a new match win probability prediction.
 */
const predict = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const {
      teamA,
      teamB,
      pitch_condition,
      weather,
      toss_winner,
      toss_decision,
      venue,
      match_type,
      match_id,
    } = req.body;

    const prediction = await createPrediction({
      teamAId: teamA,
      teamBId: teamB,
      pitchCondition: pitch_condition,
      weather,
      tossWinnerId: toss_winner,
      tossDecision: toss_decision,
      venue,
      matchType: match_type || 'T20',
      matchId: match_id,
      requestMeta: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      },
    });

    logger.info(`[PredictionController] Prediction created for ${teamA} vs ${teamB}`);

    return sendCreated(res, prediction, 'Prediction generated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/predict/:id
 * Retrieve a stored prediction by ID.
 */
const getPredictionById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('input.teamA.id input.teamB.id', 'name shortName strengthScore')
      .populate('match', 'title status scheduledAt')
      .lean();

    if (!prediction) return sendNotFound(res, 'Prediction not found');

    return sendSuccess(res, prediction);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/predict/history
 * List historical predictions with pagination.
 */
const getPredictionHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.resolved === 'true') filter['accuracy.resolvedAt'] = { $ne: null };
    if (req.query.resolved === 'false') filter['accuracy.resolvedAt'] = null;
    if (req.query.team) {
      filter.$or = [
        { 'input.teamA.id': req.query.team },
        { 'input.teamB.id': req.query.team },
      ];
    }

    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-result.featureVector -requestMetadata')
        .lean(),
      Prediction.countDocuments(filter),
    ]);

    return sendPaginated(res, predictions, page, limit, total, 'Prediction history retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/predict/:id/resolve
 * Resolve prediction accuracy after match result is known.
 */
const resolveAccuracy = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const { actual_winner_id, actual_winner_name } = req.body;
    const prediction = await resolvePrediction(req.params.id, actual_winner_id, actual_winner_name);

    return sendSuccess(res, {
      predictionId: prediction._id,
      wasCorrect: prediction.accuracy.wasCorrect,
      brierScore: prediction.accuracy.probabilityScore,
      actualWinner: prediction.accuracy.actualWinner.name,
      predictedWinner: prediction.result.predictedWinner.name,
    }, 'Prediction resolved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/predict/accuracy
 * Get overall prediction system accuracy metrics.
 */
const getAccuracy = async (req, res, next) => {
  try {
    const stats = await getAccuracyStats();
    return sendSuccess(res, stats, 'Accuracy stats retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { predict, getPredictionById, getPredictionHistory, resolveAccuracy, getAccuracy };
