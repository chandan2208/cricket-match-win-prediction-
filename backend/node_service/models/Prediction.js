'use strict';

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    // Snapshot of input at prediction time
    input: {
      teamA: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        name: String,
        strengthScore: Number,
        formScore: Number,
        recentForm: [String],
      },
      teamB: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        name: String,
        strengthScore: Number,
        formScore: Number,
        recentForm: [String],
      },
      pitchCondition: {
        type: String,
        enum: ['batting-friendly', 'bowling-friendly', 'spin-friendly', 'pace-friendly', 'neutral'],
        required: true,
      },
      weather: {
        type: String,
        enum: ['sunny', 'cloudy', 'overcast', 'rainy', 'windy', 'humid'],
        required: true,
      },
      tossWinner: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        name: String,
      },
      tossDecision: {
        type: String,
        enum: ['bat', 'field'],
        required: true,
      },
      venue: { type: String, default: null },
      matchType: {
        type: String,
        enum: ['Test', 'ODI', 'T20', 'T20I', 'IPL', 'Other'],
        default: 'T20',
      },
    },
    // ML model output
    result: {
      teamAWinProbability: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      teamBWinProbability: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      predictedWinner: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        name: String,
      },
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
      },
      keyFactors: [
        {
          factor: { type: String },
          description: { type: String },
          impact: { type: String, enum: ['positive_A', 'positive_B', 'neutral'] },
          weight: { type: Number },
        },
      ],
      modelVersion: { type: String, default: '1.0.0' },
      featureVector: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    // Accuracy tracking — filled after match is completed
    accuracy: {
      actualWinner: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
        name: { type: String, default: null },
      },
      wasCorrect: { type: Boolean, default: null },
      probabilityScore: {
        // Brier score: lower is better (measures calibration)
        type: Number,
        default: null,
      },
      resolvedAt: { type: Date, default: null },
    },
    requestMetadata: {
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
      requestId: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: human-readable probability percentages
predictionSchema.virtual('probabilities').get(function () {
  return {
    teamA: parseFloat((this.result.teamAWinProbability * 100).toFixed(1)),
    teamB: parseFloat((this.result.teamBWinProbability * 100).toFixed(1)),
  };
});

predictionSchema.index({ match: 1 });
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ 'result.predictedWinner.id': 1 });
predictionSchema.index({ 'accuracy.wasCorrect': 1 });
predictionSchema.index({ 'input.teamA.id': 1, 'input.teamB.id': 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;
