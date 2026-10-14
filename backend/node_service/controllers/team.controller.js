'use strict';

const { validationResult } = require('express-validator');
const Team = require('../models/Team');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound, sendPaginated } = require('../utils/responseHelper');

const getAllTeams = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.teamType) filter.teamType = req.query.teamType;
    if (req.query.country) filter.country = new RegExp(req.query.country, 'i');
    if (req.query.search) filter.name = new RegExp(req.query.search, 'i');

    const [teams, total] = await Promise.all([
      Team.find(filter)
        .select('-players')
        .sort({ strengthScore: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Team.countDocuments(filter),
    ]);

    return sendPaginated(res, teams, page, limit, total, 'Teams retrieved');
  } catch (err) {
    next(err);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('players', 'name role battingStyle bowlingStyle performanceRating iccRanking battingStats bowlingStats')
      .lean();
    if (!team) return sendNotFound(res, 'Team not found');
    return sendSuccess(res, team);
  } catch (err) {
    next(err);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendBadRequest(res, 'Validation failed', errors.array());

    const team = await Team.create(req.body);
    return sendCreated(res, team, 'Team created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendBadRequest(res, `Team with name '${req.body.name}' already exists`);
    }
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!team) return sendNotFound(res, 'Team not found');
    return sendSuccess(res, team, 'Team updated');
  } catch (err) {
    next(err);
  }
};

const updateTeamForm = async (req, res, next) => {
  try {
    const { result } = req.body;
    const validResults = ['W', 'L', 'D', 'NR'];
    if (!validResults.includes(result)) {
      return sendBadRequest(res, `Result must be one of: ${validResults.join(', ')}`);
    }

    const team = await Team.findById(req.params.id);
    if (!team) return sendNotFound(res, 'Team not found');

    team.recentForm.push(result);
    if (team.recentForm.length > 10) team.recentForm.shift();

    // Update stats
    team.stats.totalMatches += 1;
    if (result === 'W') team.stats.wins += 1;
    else if (result === 'L') team.stats.losses += 1;
    else if (result === 'D') team.stats.draws += 1;
    else team.stats.noResults += 1;

    await team.save();
    return sendSuccess(res, { recentForm: team.recentForm, stats: team.stats }, 'Team form updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTeams, getTeamById, createTeam, updateTeam, updateTeamForm };
