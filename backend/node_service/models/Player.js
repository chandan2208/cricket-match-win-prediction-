'use strict';

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    role: {
      type: String,
      enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
      required: true,
    },
    battingStyle: {
      type: String,
      enum: ['right-hand', 'left-hand', null],
      default: null,
    },
    bowlingStyle: {
      type: String,
      enum: [
        'right-arm-fast', 'left-arm-fast',
        'right-arm-medium', 'left-arm-medium',
        'right-arm-spin', 'left-arm-spin',
        'none', null,
      ],
      default: null,
    },
    // Performance rating [0-100], used as ML feature
    performanceRating: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    battingStats: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      notOuts: { type: Number, default: 0 },
    },
    bowlingStats: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      bestBowling: { type: String, default: '0/0' },
      average: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      fiveWickets: { type: Number, default: 0 },
    },
    // Recent form for last 5 innings (runs scored / wickets taken)
    recentBattingForm: {
      type: [Number],
      default: [],
    },
    recentBowlingForm: {
      // wickets taken per game
      type: [Number],
      default: [],
    },
    iccRanking: {
      batting: { type: Number, default: null },
      bowling: { type: Number, default: null },
      allRounder: { type: Number, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: average recent batting form
playerSchema.virtual('avgRecentRuns').get(function () {
  if (!this.recentBattingForm.length) return 0;
  const sum = this.recentBattingForm.reduce((a, b) => a + b, 0);
  return parseFloat((sum / this.recentBattingForm.length).toFixed(2));
});

// Virtual: average recent bowling form (wickets per match)
playerSchema.virtual('avgRecentWickets').get(function () {
  if (!this.recentBowlingForm.length) return 0;
  const sum = this.recentBowlingForm.reduce((a, b) => a + b, 0);
  return parseFloat((sum / this.recentBowlingForm.length).toFixed(2));
});

playerSchema.index({ name: 1 });
playerSchema.index({ team: 1 });
playerSchema.index({ role: 1 });
playerSchema.index({ performanceRating: -1 });

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
