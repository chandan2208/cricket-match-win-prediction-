'use strict';

const Team = require('../models/Team');
const Prediction = require('../models/Prediction');
const { buildFeatureVector } = require('./featureEngineeringService');
const { getPrediction } = require('./mlService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Determines confidence band based on probability gap.
 */
const getConfidenceBand = (probA, probB) => {
  const gap = Math.abs(probA - probB);
  if (gap >= 0.20) return 'high';
  if (gap >= 0.10) return 'medium';
  return 'low';
};

/**
 * Generates human-readable key factors from ML output and engineered features.
 */
const buildKeyFactors = (mlFactors, meta) => {
  const { teamA, teamB, h2hRatio, venueWinRatioA, venueWinRatioB, tossAdvantageFactor, environmentBiases } = meta;

  const candidateFactors = [
    // From ML model (if returned)
    ...(mlFactors || []),
    // Derived explanatory factors
    {
      factor: 'Team Strength Differential',
      description: `${teamA.name} has a strength score of ${teamA.strengthScore} vs ${teamB.name}'s ${teamB.strengthScore}`,
      impact: teamA.strengthScore > teamB.strengthScore ? 'positive_A' : teamA.strengthScore < teamB.strengthScore ? 'positive_B' : 'neutral',
      weight: Math.abs((teamA.strengthScore - teamB.strengthScore) / 100),
    },
    {
      factor: 'Head-to-Head Record',
      description: h2hRatio === 0.5
        ? 'Neutral head-to-head history'
        : `${teamA.name} has won ${Math.round(h2hRatio * 100)}% of H2H matches`,
      impact: h2hRatio > 0.5 ? 'positive_A' : h2hRatio < 0.5 ? 'positive_B' : 'neutral',
      weight: Math.abs(h2hRatio - 0.5) * 2,
    },
    {
      factor: 'Toss Advantage',
      description: `Toss result favors ${tossAdvantageFactor > 0.5 ? teamA.name : teamB.name} (modifier: ${Math.abs(tossAdvantageFactor - 0.5).toFixed(2)})`,
      impact: tossAdvantageFactor > 0.5 ? 'positive_A' : 'positive_B',
      weight: Math.abs(tossAdvantageFactor - 0.5) * 2,
    },
  ];

  // Add Dynamic Environmental Factors
  if (environmentBiases) {
    const { teamA: biasA, teamB: biasB, pitchCondition, weather } = environmentBiases;
    
    if (biasA.bias > 0) {
      candidateFactors.push({
        factor: 'Tactical Condition Advantage',
        description: `${pitchCondition === 'spin-friendly' ? 'Spin-friendly' : 'Pace-friendly'} pitch heavily favors ${teamA.name}'s ${biasA.archetype} attack.`,
        impact: 'positive_A',
        weight: biasA.bias * 2
      });
    }
    if (biasB.bias > 0) {
      candidateFactors.push({
        factor: 'Tactical Condition Advantage',
        description: `${pitchCondition === 'spin-friendly' ? 'Spin-friendly' : 'Pace-friendly'} pitch heavily favors ${teamB.name}'s ${biasB.archetype} attack.`,
        impact: 'positive_B',
        weight: biasB.bias * 2
      });
    }
    if (weather === 'overcast' && (biasA.archetype === 'swing' || biasB.archetype === 'swing')) {
      const winner = biasA.archetype === 'swing' ? teamA.name : teamB.name;
      candidateFactors.push({
        factor: 'Atmospheric Influence',
        description: `Overcast atmosphere provides critical lateral movement for ${winner}'s swing bowlers.`,
        impact: biasA.archetype === 'swing' ? 'positive_A' : 'positive_B',
        weight: 0.25
      });
    }
  }

  // Sort by weight descending, return top 3
  return candidateFactors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ factor, description, impact, weight }) => ({
      factor,
      description,
      impact,
      weight: parseFloat(weight.toFixed(4)),
    }));
};

/**
 * Core prediction pipeline:
 * 1. Validate teams
 * 2. Engineer features
 * 3. Call ML microservice
 * 4. Build response + persist prediction
 */
const createPrediction = async ({
  teamAId,
  teamBId,
  pitchCondition,
  weather,
  tossWinnerId,
  tossDecision,
  venue,
  matchType,
  matchId: mId,
  requestMeta,
}) => {
  logger.info(`[PredictionService] mId=${mId}`);
  logger.info(`[PredictionService] Starting prediction: ${teamAId} vs ${teamBId}`, {
    pitchCondition, weather, tossWinnerId, tossDecision 
  });

  // 1. Build feature vector
  const { features, meta } = await buildFeatureVector({
    teamAId,
    teamBId,
    pitchCondition,
    weather,
    tossWinnerId,
    tossDecision,
    venue,
    matchType,
  });

  logger.debug('[PredictionService] Feature vector built', { features });

  // 2. Call ML microservice
  const mlResponse = await getPrediction({ features, match_type: matchType });

  const teamA_win_prob = mlResponse?.meta?.teamA_win_prob ?? mlResponse?.data?.win_probability ?? 0.5;
  const teamB_win_prob = mlResponse?.meta?.teamB_win_prob ?? parseFloat((1 - teamA_win_prob).toFixed(4));
  const mlFactors = mlResponse?.data?.key_factors ?? mlResponse?.meta?.key_factors ?? [];
  const model_version = mlResponse?.meta?.model_version || '1.0.0';

  // 3. Determine winner & confidence
  const predictedWinnerIsA = teamA_win_prob >= teamB_win_prob;
  const confidence = getConfidenceBand(teamA_win_prob, teamB_win_prob);

  // 4. Build key factors
  const keyFactors = buildKeyFactors(mlFactors, meta);

  // 5. Persist prediction to DB
  const predictionDoc = await Prediction.create({
    match: mId || null,
    input: {
      teamA: {
        id: meta.teamA._id,
        name: meta.teamA.name,
        strengthScore: meta.teamA.strengthScore,
        formScore: meta.teamA.formScore,
        recentForm: meta.teamA.recentForm || [],
      },
      teamB: {
        id: meta.teamB._id,
        name: meta.teamB.name,
        strengthScore: meta.teamB.strengthScore,
        formScore: meta.teamB.formScore,
        recentForm: meta.teamB.recentForm || [],
      },
      pitchCondition,
      weather,
      tossWinner: {
        id: tossWinnerId,
        name: predictedWinnerIsA ? meta.teamA.name : meta.teamB.name,
      },
      tossDecision,
      venue: venue || null,
      matchType: matchType || 'T20',
    },
    result: {
      teamAWinProbability: parseFloat(teamA_win_prob.toFixed(4)),
      teamBWinProbability: parseFloat(teamB_win_prob.toFixed(4)),
      predictedWinner: {
        id: predictedWinnerIsA ? meta.teamA._id : meta.teamB._id,
        name: predictedWinnerIsA ? meta.teamA.name : meta.teamB.name,
      },
      confidence,
      keyFactors,
      modelVersion: model_version || '1.0.0',
      featureVector: features,
    },
    requestMetadata: requestMeta || {},
  });

  logger.info(`[PredictionService] Prediction saved: ${predictionDoc._id}`);

  return {
    predictionId: predictionDoc._id,
    teamA: {
      name: meta.teamA.name,
      winProbability: parseFloat((teamA_win_prob * 100).toFixed(1)),
    },
    teamB: {
      name: meta.teamB.name,
      winProbability: parseFloat((teamB_win_prob * 100).toFixed(1)),
    },
    predictedWinner: predictionDoc.result.predictedWinner.name,
    confidence,
    keyFactors,
    modelVersion: model_version || '1.0.0',
    generatedAt: predictionDoc.createdAt,
  };
};

/**
 * Resolve a prediction after match completion and update accuracy.
 */
const resolvePrediction = async (predictionId, actualWinnerId, actualWinnerName) => {
  const prediction = await Prediction.findById(predictionId);
  if (!prediction) throw AppError.notFound('Prediction not found');

  const wasCorrect =
    prediction.result.predictedWinner.id.toString() === actualWinnerId.toString();

  // Brier score: (predicted_prob - actual_outcome)^2  (lower = better calibration)
  const predictedProb = wasCorrect
    ? prediction.result.teamAWinProbability >= 0.5
      ? prediction.result.teamAWinProbability
      : prediction.result.teamBWinProbability
    : prediction.result.teamAWinProbability >= 0.5
    ? prediction.result.teamAWinProbability
    : prediction.result.teamBWinProbability;

  const brierScore = parseFloat(Math.pow(predictedProb - (wasCorrect ? 1 : 0), 2).toFixed(4));

  prediction.accuracy = {
    actualWinner: { id: actualWinnerId, name: actualWinnerName },
    wasCorrect,
    probabilityScore: brierScore,
    resolvedAt: new Date(),
  };

  await prediction.save();
  return prediction;
};

/**
 * Get overall prediction accuracy stats
 */
const getAccuracyStats = async () => {
  const resolved = await Prediction.find({ 'accuracy.resolvedAt': { $ne: null } }).lean();
  if (!resolved.length) return { total: 0, correct: 0, accuracy: 0, avgBrierScore: null };

  const correct = resolved.filter((p) => p.accuracy.wasCorrect).length;
  const brierScores = resolved
    .filter((p) => p.accuracy.probabilityScore !== null)
    .map((p) => p.accuracy.probabilityScore);

  const avgBrier = brierScores.length
    ? parseFloat((brierScores.reduce((a, b) => a + b, 0) / brierScores.length).toFixed(4))
    : null;

  return {
    total: resolved.length,
    correct,
    accuracy: parseFloat(((correct / resolved.length) * 100).toFixed(2)),
    avgBrierScore: avgBrier,
  };
};

module.exports = { createPrediction, resolvePrediction, getAccuracyStats };
