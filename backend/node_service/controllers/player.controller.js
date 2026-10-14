'use strict';

const { validationResult } = require('express-validator');
const Player = require('../models/Player');
const Team = require('../models/Team');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound, sendPaginated } = require('../utils/responseHelper');

const getAllPlayers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.team) filter.team = req.query.team;
    if (req.query.country) filter.country = new RegExp(req.query.country, 'i');
    if (req.query.search) filter.name = new RegExp(req.query.search, 'i');

    const sortField = req.query.sortBy || 'performanceRating';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [players, total] = await Promise.all([
      Player.find(filter)
        .populate('team', 'name shortName')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Player.countDocuments(filter),
    ]);

    return sendPaginated(res, players, page, limit, total, 'Players retrieved');
  } catch (err) {
    next(err);
  }
};

const getPlayerById = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate('team', 'name shortName logo').lean();
    if (!player) return sendNotFound(res, 'Player not found');
    return sendSuccess(res, player);
  } catch (err) {
    next(err);
  }
};

const createPlayer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendBadRequest(res, 'Validation failed', errors.array());

    const player = await Player.create(req.body);

    // Add player to team's player list
    await Team.findByIdAndUpdate(req.body.team, { $addToSet: { players: player._id } });

    return sendCreated(res, player, 'Player created successfully');
  } catch (err) {
    next(err);
  }
};

const updatePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('team', 'name shortName');

    if (!player) return sendNotFound(res, 'Player not found');
    return sendSuccess(res, player, 'Player updated');
  } catch (err) {
    next(err);
  }
};

const updatePlayerForm = async (req, res, next) => {
  try {
    const { batting_runs, wickets_taken } = req.body;
    const player = await Player.findById(req.params.id);
    if (!player) return sendNotFound(res, 'Player not found');

    if (batting_runs !== undefined) {
      player.recentBattingForm.push(batting_runs);
      if (player.recentBattingForm.length > 10) player.recentBattingForm.shift();
    }
    if (wickets_taken !== undefined) {
      player.recentBowlingForm.push(wickets_taken);
      if (player.recentBowlingForm.length > 10) player.recentBowlingForm.shift();
    }

    await player.save();
    return sendSuccess(res, {
      recentBattingForm: player.recentBattingForm,
      recentBowlingForm: player.recentBowlingForm,
    }, 'Player form updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPlayers, getPlayerById, createPlayer, updatePlayer, updatePlayerForm };
