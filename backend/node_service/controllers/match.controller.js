'use strict';

const { validationResult } = require('express-validator');
const Match = require('../models/Match');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound, sendPaginated } = require('../utils/responseHelper');
const AppError = require('../utils/AppError');

/**
 * GET /api/v1/matches/live
 */
const getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .populate('teamA teamB', 'name shortName logo strengthScore')
      .populate('liveData.battingTeam', 'name shortName')
      .sort({ scheduledAt: -1 })
      .lean();

    return sendSuccess(res, matches, `${matches.length} live match(es) found`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/matches/history
 */
const getMatchHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { status: 'completed' };
    if (req.query.matchType) filter.matchType = req.query.matchType;
    if (req.query.team) {
      filter.$or = [{ teamA: req.query.team }, { teamB: req.query.team }];
    }
    if (req.query.from) filter.scheduledAt = { $gte: new Date(req.query.from) };
    if (req.query.to) {
      filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(req.query.to) };
    }

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate('teamA teamB winner', 'name shortName')
        .populate('playerOfTheMatch', 'name role')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    return sendPaginated(res, matches, page, limit, total, 'Match history retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/matches/upcoming
 */
const getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      status: 'upcoming',
      scheduledAt: { $gte: new Date() },
    })
      .populate('teamA teamB', 'name shortName logo')
      .sort({ scheduledAt: 1 })
      .limit(20)
      .lean();

    return sendSuccess(res, matches, `${matches.length} upcoming match(es)`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/matches/:id
 */
const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA teamB winner', 'name shortName logo strengthScore recentForm')
      .populate('tossWinner', 'name')
      .populate('playerOfTheMatch', 'name role battingStats bowlingStats')
      .lean();

    if (!match) return sendNotFound(res, 'Match not found');
    return sendSuccess(res, match);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/matches
 * Create a new match record.
 */
const createMatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const match = await Match.create(req.body);
    await match.populate('teamA teamB', 'name shortName');
    return sendCreated(res, match, 'Match created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/matches/:id/status
 * Update match status (e.g., upcoming → live → completed).
 */
const updateMatchStatus = async (req, res, next) => {
  try {
    const { status, winner, resultDescription, scorecard, liveData } = req.body;

    const allowedTransitions = {
      upcoming: ['live', 'abandoned'],
      live: ['completed', 'abandoned', 'no_result'],
      completed: [],
      abandoned: [],
      no_result: [],
    };

    const match = await Match.findById(req.params.id);
    if (!match) return sendNotFound(res, 'Match not found');

    if (!allowedTransitions[match.status]?.includes(status)) {
      return sendBadRequest(
        res,
        `Cannot transition match from '${match.status}' to '${status}'`
      );
    }

    match.status = status;
    if (winner) match.winner = winner;
    if (resultDescription) match.resultDescription = resultDescription;
    if (scorecard) match.scorecard = scorecard;
    if (liveData) match.liveData = { ...match.liveData, ...liveData };
    if (status === 'completed') match.completedAt = new Date();

    await match.save();
    await match.populate('teamA teamB winner', 'name shortName');

    return sendSuccess(res, match, 'Match status updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLiveMatches,
  getMatchHistory,
  getUpcomingMatches,
  getMatchById,
  createMatch,
  updateMatchStatus,
};
