'use strict';

const { getTeamAnalytics, getPlayerAnalytics, getSystemAnalytics } = require('../services/analyticsService');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * GET /api/v1/analytics/team/:id
 */
const teamAnalytics = async (req, res, next) => {
  try {
    const data = await getTeamAnalytics(req.params.id);
    return sendSuccess(res, data, 'Team analytics retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/analytics/player/:id
 */
const playerAnalytics = async (req, res, next) => {
  try {
    const data = await getPlayerAnalytics(req.params.id);
    return sendSuccess(res, data, 'Player analytics retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/analytics/system
 * Overall system health and prediction accuracy dashboard.
 */
const systemAnalytics = async (req, res, next) => {
  try {
    const data = await getSystemAnalytics();
    return sendSuccess(res, data, 'System analytics retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { teamAnalytics, playerAnalytics, systemAnalytics };
