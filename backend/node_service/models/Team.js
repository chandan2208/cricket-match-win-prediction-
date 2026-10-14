'use strict';

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      uppercase: true,
      maxlength: [5, 'Short name cannot exceed 5 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    teamType: {
      type: String,
      enum: ['international', 'ipl', 'domestic', 'bbl', 'other'],
      required: true,
      default: 'international',
    },
    logo: {
      type: String,
      default: null,
    },
    // Computed ranking & strength score [0–100]
    strengthScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    iccRanking: {
      test: { type: Number, default: null },
      odi: { type: Number, default: null },
      t20: { type: Number, default: null },
    },
    stats: {
      totalMatches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      noResults: { type: Number, default: 0 },
      winPercentage: { type: Number, default: 0 },
    },
    // Last 5 match results for form tracking: 'W', 'L', 'D', 'NR'
    recentForm: {
      type: [String],
      enum: ['W', 'L', 'D', 'NR'],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Recent form can have at most 10 entries',
      },
    },
    // Venue-specific performance
    homeRecord: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
    },
    awayRecord: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
    },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: form score (weighted W=1, D=0.5, L/NR=0) for last 5
teamSchema.virtual('formScore').get(function () {
  const last5 = this.recentForm.slice(-5);
  if (!last5.length) return 0;
  const total = last5.reduce((acc, r) => {
    if (r === 'W') return acc + 1;
    if (r === 'D') return acc + 0.5;
    return acc;
  }, 0);
  return parseFloat((total / last5.length).toFixed(3));
});

// Pre-save: recompute win percentage
teamSchema.pre('save', function (next) {
  const { totalMatches, wins } = this.stats;
  this.stats.winPercentage = totalMatches > 0
    ? parseFloat(((wins / totalMatches) * 100).toFixed(2))
    : 0;
  next();
});

// Indexes for performance
teamSchema.index({ name: 1 });
teamSchema.index({ country: 1 });
teamSchema.index({ teamType: 1 });
teamSchema.index({ strengthScore: -1 });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
