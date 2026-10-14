'use strict';

const Team = require('../models/Team');
const Match = require('../models/Match');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Encoding maps for categorical features (must match Python side)
const PITCH_ENCODING = {
  'batting-friendly': 0,
  'bowling-friendly': 1,
  'spin-friendly': 2,
  'pace-friendly': 3,
  'neutral': 4,
};

const WEATHER_ENCODING = {
  'sunny': 0,
  'cloudy': 1,
  'overcast': 2,
  'rainy': 3,
  'windy': 4,
  'humid': 5,
};

const MATCH_TYPE_ENCODING = {
  'T20': 0,
  'T20I': 0,
  'IPL': 0,
  'ODI': 1,
  'Test': 2,
  'Other': 1,
};

/**
 * Computes form score from an array of result strings: W=1, D=0.5, L/NR=0
 * Applies exponential decay — more recent results weighted higher.
 */
const computeWeightedFormScore = (formArray) => {
  if (!formArray || formArray.length === 0) return 0.5;
  const recent = formArray.slice(-10); // last 10 results
  let weightedSum = 0;
  let totalWeight = 0;
  recent.forEach((result, i) => {
    const weight = Math.pow(1.2, i); // more recent = higher weight
    const value = result === 'W' ? 1 : result === 'D' ? 0.5 : 0;
    weightedSum += value * weight;
    totalWeight += weight;
  });
  return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(4)) : 0.5;
};

/**
 * Calculates head-to-head win ratio for teamA vs teamB from historical matches.
 */
const computeH2HRatio = async (teamAId, teamBId) => {
  const matches = await Match.find({
    status: 'completed',
    winner: { $ne: null },
    $or: [
      { teamA: teamAId, teamB: teamBId },
      { teamA: teamBId, teamB: teamAId },
    ],
  }).select('winner').lean();

  if (matches.length === 0) return 0.5; // No history → neutral

  const teamAWins = matches.filter(
    (m) => m.winner.toString() === teamAId.toString()
  ).length;

  return parseFloat((teamAWins / matches.length).toFixed(4));
};

/**
 * Gets venue-specific win ratio for a team at the given venue string.
 */
const computeVenueWinRatio = async (teamId, venueName) => {
  if (!venueName) return 0.5;

  const total = await Match.countDocuments({
    status: 'completed',
    'venue.name': new RegExp(venueName, 'i'),
    $or: [{ teamA: teamId }, { teamB: teamId }],
  });

  if (total === 0) return 0.5;

  const wins = await Match.countDocuments({
    status: 'completed',
    'venue.name': new RegExp(venueName, 'i'),
    winner: teamId,
  });

  return parseFloat((wins / total).toFixed(4));
};

/**
 * Toss advantage factor:
 * In T20s, batting first post-toss decision matters less at certain venues.
 * Returns [0-1]: 1 = maximum toss advantage for teamA, 0 = max for teamB, 0.5 = neutral.
 */
const computeTossAdvantage = (tossWinnerId, teamAId, tossDecision, pitchCondition) => {
  const tossWentToA = tossWinnerId?.toString() === teamAId?.toString();

  // Batting-friendly → toss winner who chose to bat has edge
  // Bowling-friendly / overcast → fielding first gives edge
  let baseAdvantage = 0.55; // slight edge for toss winner always

  if (pitchCondition === 'batting-friendly' && tossDecision === 'bat') {
    baseAdvantage = 0.62;
  } else if (['bowling-friendly', 'pace-friendly'].includes(pitchCondition) && tossDecision === 'field') {
    baseAdvantage = 0.60;
  }

  return tossWentToA ? baseAdvantage : 1 - baseAdvantage;
};

/**
 * Main feature engineering function.
 * Returns a feature vector compatible with the Python ML model.
 */
const buildFeatureVector = async ({
  teamAId,
  teamBId,
  pitchCondition,
  weather,
  tossWinnerId,
  tossDecision,
  venue,
  matchType = 'T20',
}) => {
  // Fetch team documents
  const [teamA, teamB] = await Promise.all([
    Team.findById(teamAId).lean(),
    Team.findById(teamBId).lean(),
  ]);

  if (!teamA) throw AppError.notFound(`Team A not found: ${teamAId}`);
  if (!teamB) throw AppError.notFound(`Team B not found: ${teamBId}`);

  logger.debug(`[FeatureEng] Building features for ${teamA.name} vs ${teamB.name}`);

  // Parallel computation of derived features
  const [h2hRatio, venueWinRatioA, venueWinRatioB] = await Promise.all([
    computeH2HRatio(teamAId, teamBId),
    computeVenueWinRatio(teamAId, venue),
    computeVenueWinRatio(teamBId, venue),
  ]);

  const formScoreA = computeWeightedFormScore(teamA.recentForm);
  const formScoreB = computeWeightedFormScore(teamB.recentForm);

  const tossAdvantageFactor = computeTossAdvantage(
    tossWinnerId, teamAId, tossDecision, pitchCondition
  );

  // --- Environmental Bias Logic ---
  const spinTeams = ['India', 'Sri Lanka', 'Afghanistan', 'Pakistan', 'Bangladesh'];
  const paceTeams = ['Australia', 'South Africa', 'West Indies'];
  const swingTeams = ['England', 'New Zealand'];

  const getTeamArchetype = (name) => {
    if (spinTeams.includes(name)) return 'spin';
    if (paceTeams.includes(name)) return 'pace';
    if (swingTeams.includes(name)) return 'swing';
    return 'neutral';
  };

  const archA = getTeamArchetype(teamA.name);
  const archB = getTeamArchetype(teamB.name);

  let biasA = 0;
  let biasB = 0;

  // Pitch Biases
  if (pitchCondition === 'spin-friendly') {
    if (archA === 'spin') biasA += 0.08;
    if (archB === 'spin') biasB += 0.08;
  } else if (pitchCondition === 'pace-friendly') {
    if (archA === 'pace') biasA += 0.08;
    if (archB === 'pace') biasB += 0.08;
  }

  // Weather Biases
  if (weather === 'overcast') {
    if (archA === 'swing') biasA += 0.10;
    if (archB === 'swing') biasB += 0.10;
  } else if (weather === 'humid') {
    if (archA === 'spin') biasA += 0.05;
    if (archB === 'spin') biasB += 0.05;
  }

  // Normalize strength score to [0,1] and apply biases
  let strengthA = (teamA.strengthScore || 50) / 100;
  let strengthB = (teamB.strengthScore || 50) / 100;

  strengthA = Math.min(1.0, strengthA + biasA);
  strengthB = Math.min(1.0, strengthB + biasB);

  // Win percentage delta [-1, 1]
  const winPctA = (teamA.stats?.winPercentage || 50) / 100;
  const winPctB = (teamB.stats?.winPercentage || 50) / 100;

  const features = {
    // Team strength features (with bias injected)
    team_a_strength: strengthA,
    team_b_strength: strengthB,
    strength_diff: parseFloat((strengthA - strengthB).toFixed(4)),

    // Form features
    team_a_form: formScoreA,
    team_b_form: formScoreB,
    form_diff: parseFloat((formScoreA - formScoreB).toFixed(4)),

    // Win history
    team_a_win_pct: winPctA,
    team_b_win_pct: winPctB,

    // H2H
    h2h_ratio_a: h2hRatio,

    // Venue advantage
    venue_win_ratio_a: venueWinRatioA,
    venue_win_ratio_b: venueWinRatioB,
    venue_advantage_diff: parseFloat((venueWinRatioA - venueWinRatioB).toFixed(4)),

    // Toss
    toss_advantage_a: tossAdvantageFactor,

    // Categorical (encoded)
    pitch_condition: PITCH_ENCODING[pitchCondition] ?? 4,
    weather_condition: WEATHER_ENCODING[weather] ?? 0,
    match_type: MATCH_TYPE_ENCODING[matchType] ?? 0,

    // Rankings (normalized, lower rank = better)
    icc_ranking_a_t20: teamA.iccRanking?.t20 ? Math.max(0, 1 - (teamA.iccRanking.t20 / 20)) : 0.5,
    icc_ranking_b_t20: teamB.iccRanking?.t20 ? Math.max(0, 1 - (teamB.iccRanking.t20 / 20)) : 0.5,
  };

  // Metadata for explanations (not sent to model, used for key_factors)
  const meta = {
    teamA: { name: teamA.name, ...teamA },
    teamB: { name: teamB.name, ...teamB },
    h2hRatio,
    venueWinRatioA,
    venueWinRatioB,
    tossAdvantageFactor,
    environmentBiases: {
      teamA: { bias: biasA, archetype: archA },
      teamB: { bias: biasB, archetype: archB },
      pitchCondition,
      weather
    }
  };

  logger.info(`[FeatureEng] features for ${teamA.name} vs ${teamB.name}`, { features });

  return { features, meta };
};

module.exports = { buildFeatureVector, computeWeightedFormScore };
