'use strict';

const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const AppError = require('../utils/AppError');

/**
 * Team analytics: aggregates match history + prediction accuracy for a team.
 */
const getTeamAnalytics = async (teamId) => {
  const team = await Team.findById(teamId).populate('players', 'name role performanceRating battingStats bowlingStats').lean();
  if (!team) throw AppError.notFound('Team not found');

  // Match breakdown by type
  const matchBreakdown = await Match.aggregate([
    {
      $match: {
        status: 'completed',
        $or: [{ teamA: team._id }, { teamB: team._id }],
      },
    },
    {
      $group: {
        _id: '$matchType',
        total: { $sum: 1 },
        wins: {
          $sum: { $cond: [{ $eq: ['$winner', team._id] }, 1, 0] },
        },
      },
    },
  ]);

  // Last 10 completed matches
  const recentMatches = await Match.find({
    status: 'completed',
    $or: [{ teamA: teamId }, { teamB: teamId }],
  })
    .sort({ completedAt: -1 })
    .limit(10)
    .populate('teamA teamB winner', 'name shortName')
    .lean();

  // Prediction accuracy for this team as predicted winner
  const predAccuracy = await Prediction.aggregate([
    {
      $match: {
        'accuracy.resolvedAt': { $ne: null },
        $or: [
          { 'input.teamA.id': team._id },
          { 'input.teamB.id': team._id },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$accuracy.wasCorrect', 1, 0] } },
        avgBrier: { $avg: '$accuracy.probabilityScore' },
      },
    },
  ]);

  // Top performers in team by performance rating
  const topBatsmen = team.players
    ? team.players
        .filter((p) => ['batsman', 'all-rounder', 'wicket-keeper'].includes(p.role))
        .sort((a, b) => b.battingStats.average - a.battingStats.average)
        .slice(0, 5)
    : [];

  const topBowlers = team.players
    ? team.players
        .filter((p) => ['bowler', 'all-rounder'].includes(p.role))
        .sort((a, b) => b.bowlingStats.wickets - a.bowlingStats.wickets)
        .slice(0, 5)
    : [];

  return {
    team: {
      _id: team._id,
      name: team.name,
      shortName: team.shortName,
      country: team.country,
      strengthScore: team.strengthScore,
      iccRanking: team.iccRanking,
    },
    overallStats: team.stats,
    recentForm: team.recentForm?.slice(-10) || [],
    matchBreakdown,
    recentMatches: recentMatches.map((m) => ({
      matchId: m._id,
      title: m.title,
      matchType: m.matchType,
      opponent: m.teamA._id.toString() === teamId ? m.teamB.name : m.teamA.name,
      result: m.winner?._id?.toString() === teamId ? 'W' : 'L',
      resultDescription: m.resultDescription,
      date: m.completedAt,
    })),
    predictionAccuracy: predAccuracy[0]
      ? {
          total: predAccuracy[0].total,
          correct: predAccuracy[0].correct,
          accuracyPct: parseFloat(((predAccuracy[0].correct / predAccuracy[0].total) * 100).toFixed(2)),
          avgBrierScore: parseFloat((predAccuracy[0].avgBrier || 0).toFixed(4)),
        }
      : null,
    topBatsmen,
    topBowlers,
  };
};

/**
 * Player analytics: detailed stats + recent form + match history
 */
const getPlayerAnalytics = async (playerId) => {
  const player = await Player.findById(playerId).populate('team', 'name shortName').lean();
  if (!player) throw AppError.notFound('Player not found');

  // Matches where this player was POTM
  const potmMatches = await Match.find({
    playerOfTheMatch: playerId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(5)
    .populate('teamA teamB', 'name')
    .lean();

  const recentBattingAvg = player.recentBattingForm?.length
    ? parseFloat(
        (
          player.recentBattingForm.reduce((a, b) => a + b, 0) /
          player.recentBattingForm.length
        ).toFixed(2)
      )
    : null;

  const recentBowlingAvg = player.recentBowlingForm?.length
    ? parseFloat(
        (
          player.recentBowlingForm.reduce((a, b) => a + b, 0) /
          player.recentBowlingForm.length
        ).toFixed(2)
      )
    : null;

  return {
    player: {
      _id: player._id,
      name: player.name,
      country: player.country,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      performanceRating: player.performanceRating,
      iccRanking: player.iccRanking,
      team: player.team,
    },
    battingStats: player.battingStats,
    bowlingStats: player.bowlingStats,
    recentForm: {
      batting: player.recentBattingForm?.slice(-10) || [],
      bowling: player.recentBowlingForm?.slice(-10) || [],
      recentBattingAvg,
      recentBowlingAvg,
    },
    playerOfTheMatchAwards: potmMatches.length,
    notablePerformances: potmMatches.map((m) => ({
      match: m.title,
      date: m.completedAt,
      teams: `${m.teamA.name} vs ${m.teamB.name}`,
    })),
  };
};

/**
 * Global system analytics
 */
const getSystemAnalytics = async () => {
  const [
    totalTeams,
    totalPlayers,
    totalMatches,
    liveMatches,
    totalPredictions,
    resolvedPredictions,
  ] = await Promise.all([
    Team.countDocuments({ isActive: true }),
    Player.countDocuments({ isActive: true }),
    Match.countDocuments(),
    Match.countDocuments({ status: 'live' }),
    Prediction.countDocuments(),
    Prediction.countDocuments({ 'accuracy.resolvedAt': { $ne: null } }),
  ]);

  const accuracyAgg = await Prediction.aggregate([
    { $match: { 'accuracy.resolvedAt': { $ne: null } } },
    {
      $group: {
        _id: null,
        correct: { $sum: { $cond: ['$accuracy.wasCorrect', 1, 0] } },
        avgBrier: { $avg: '$accuracy.probabilityScore' },
      },
    },
  ]);

  const accData = accuracyAgg[0] || {};
  const overallAccuracy = resolvedPredictions > 0
    ? parseFloat(((accData.correct / resolvedPredictions) * 100).toFixed(2))
    : null;

  return {
    teams: totalTeams,
    players: totalPlayers,
    matches: { total: totalMatches, live: liveMatches },
    predictions: {
      total: totalPredictions,
      resolved: resolvedPredictions,
      overallAccuracy,
      avgBrierScore: accData.avgBrier
        ? parseFloat(accData.avgBrier.toFixed(4))
        : null,
    },
  };
};

module.exports = { getTeamAnalytics, getPlayerAnalytics, getSystemAnalytics };
