'use strict';

const mongoose = require('mongoose');

const scoreCardSchema = new mongoose.Schema({
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  extras: { type: Number, default: 0 },
}, { _id: false });

const matchSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    matchType: {
      type: String,
      enum: ['Test', 'ODI', 'T20', 'T20I', 'IPL', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'abandoned', 'no_result'],
      default: 'upcoming',
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    venue: {
      name: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      pitchType: {
        type: String,
        enum: ['batting-friendly', 'bowling-friendly', 'spin-friendly', 'pace-friendly', 'neutral'],
        default: 'neutral',
      },
    },
    tossWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    tossDecision: {
      type: String,
      enum: ['bat', 'field', null],
      default: null,
    },
    weather: {
      condition: {
        type: String,
        enum: ['sunny', 'cloudy', 'overcast', 'rainy', 'windy', 'humid'],
        default: 'sunny',
      },
      temperatureCelsius: { type: Number, default: null },
      humidity: { type: Number, default: null },
    },
    scorecard: {
      teamA: { type: scoreCardSchema, default: {} },
      teamB: { type: scoreCardSchema, default: {} },
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    resultDescription: {
      type: String,
      default: null,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    series: {
      type: String,
      default: null,
    },
    umpires: {
      type: [String],
      default: [],
    },
    playerOfTheMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    liveData: {
      currentInnings: { type: Number, default: null, enum: [1, 2, null] },
      battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
      currentScore: { type: scoreCardSchema, default: {} },
      requiredRunRate: { type: Number, default: null },
      currentRunRate: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

matchSchema.virtual('isLive').get(function () {
  return this.status === 'live';
});

matchSchema.virtual('durationDays').get(function () {
  if (!this.completedAt) return null;
  const ms = this.completedAt - this.scheduledAt;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
});

matchSchema.index({ status: 1, scheduledAt: -1 });
matchSchema.index({ teamA: 1 });
matchSchema.index({ teamB: 1 });
matchSchema.index({ scheduledAt: -1 });
matchSchema.index({ winner: 1 });
matchSchema.index({ matchType: 1 });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
