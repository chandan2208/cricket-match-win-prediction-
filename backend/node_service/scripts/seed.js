'use strict';
/**
 * Database seeder — populates MongoDB with realistic cricket data
 * for development and demo purposes.
 * Run: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket_prediction';

const teamsData = [
  {
    name: 'India',
    shortName: 'IND',
    country: 'India',
    teamType: 'international',
    strengthScore: 88,
    iccRanking: { test: 2, odi: 1, t20: 1 },
    recentForm: ['W', 'W', 'W', 'L', 'W', 'W', 'D', 'W'],
    stats: { totalMatches: 420, wins: 285, losses: 110, draws: 25, noResults: 0 },
    homeRecord: { matches: 210, wins: 175 },
    awayRecord: { matches: 210, wins: 110 },
  },
  {
    name: 'Australia',
    shortName: 'AUS',
    country: 'Australia',
    teamType: 'international',
    strengthScore: 85,
    iccRanking: { test: 1, odi: 2, t20: 4 },
    recentForm: ['W', 'L', 'W', 'W', 'L', 'W', 'W'],
    stats: { totalMatches: 390, wins: 258, losses: 118, draws: 14, noResults: 0 },
    homeRecord: { matches: 195, wins: 158 },
    awayRecord: { matches: 195, wins: 100 },
  },
  {
    name: 'England',
    shortName: 'ENG',
    country: 'England',
    teamType: 'international',
    strengthScore: 82,
    iccRanking: { test: 3, odi: 3, t20: 5 },
    recentForm: ['L', 'W', 'W', 'W', 'L', 'W'],
    stats: { totalMatches: 375, wins: 237, losses: 120, draws: 18, noResults: 0 },
    homeRecord: { matches: 190, wins: 148 },
    awayRecord: { matches: 185, wins: 89 },
  },
  {
    name: 'South Africa',
    shortName: 'SA',
    country: 'South Africa',
    teamType: 'international',
    strengthScore: 79,
    iccRanking: { test: 4, odi: 5, t20: 3 },
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    stats: { totalMatches: 350, wins: 218, losses: 115, draws: 17, noResults: 0 },
    homeRecord: { matches: 180, wins: 142 },
    awayRecord: { matches: 170, wins: 76 },
  },
  {
    name: 'New Zealand',
    shortName: 'NZ',
    country: 'New Zealand',
    teamType: 'international',
    strengthScore: 77,
    iccRanking: { test: 5, odi: 4, t20: 2 },
    recentForm: ['W', 'L', 'W', 'W', 'L'],
    stats: { totalMatches: 340, wins: 200, losses: 125, draws: 15, noResults: 0 },
    homeRecord: { matches: 175, wins: 135 },
    awayRecord: { matches: 165, wins: 65 },
  },
  {
    name: 'Pakistan',
    shortName: 'PAK',
    country: 'Pakistan',
    teamType: 'international',
    strengthScore: 78,
    iccRanking: { test: 6, odi: 6, t20: 6 },
    recentForm: ['L', 'W', 'W', 'W', 'L', 'W'],
    stats: { totalMatches: 355, wins: 207, losses: 135, draws: 13, noResults: 0 },
    homeRecord: { matches: 178, wins: 128 },
    awayRecord: { matches: 177, wins: 79 },
  },
];

const playersData = (teamMap) => [
  // India players
  {
    name: 'Rohit Sharma',
    country: 'India',
    team: teamMap['India'],
    role: 'batsman',
    battingStyle: 'right-hand',
    performanceRating: 92,
    battingStats: { matches: 240, innings: 238, runs: 9801, highScore: 264, average: 45.2, strikeRate: 89.5, hundreds: 30, fifties: 48 },
    recentBattingForm: [72, 0, 131, 45, 28],
    iccRanking: { batting: 3, bowling: null },
  },
  {
    name: 'Virat Kohli',
    country: 'India',
    team: teamMap['India'],
    role: 'batsman',
    battingStyle: 'right-hand',
    performanceRating: 95,
    battingStats: { matches: 285, innings: 281, runs: 13848, highScore: 183, average: 57.2, strikeRate: 93.2, hundreds: 47, fifties: 65 },
    recentBattingForm: [88, 22, 45, 101, 67],
    iccRanking: { batting: 1 },
  },
  {
    name: 'Jasprit Bumrah',
    country: 'India',
    team: teamMap['India'],
    role: 'bowler',
    bowlingStyle: 'right-arm-fast',
    performanceRating: 93,
    bowlingStats: { matches: 145, innings: 140, wickets: 232, bestBowling: '6/19', average: 21.3, economy: 4.5, fiveWickets: 3 },
    recentBowlingForm: [3, 2, 4, 1, 3],
    iccRanking: { bowling: 1 },
  },
  // Australia players
  {
    name: 'Steve Smith',
    country: 'Australia',
    team: teamMap['Australia'],
    role: 'batsman',
    battingStyle: 'right-hand',
    performanceRating: 90,
    battingStats: { matches: 210, innings: 208, runs: 9701, highScore: 239, average: 58.4, strikeRate: 55.2, hundreds: 31, fifties: 41 },
    recentBattingForm: [55, 138, 12, 74, 200],
    iccRanking: { batting: 2 },
  },
  {
    name: 'Pat Cummins',
    country: 'Australia',
    team: teamMap['Australia'],
    role: 'all-rounder',
    battingStyle: 'right-hand',
    bowlingStyle: 'right-arm-fast',
    performanceRating: 88,
    battingStats: { matches: 180, innings: 160, runs: 1850, highScore: 49, average: 14.2, strikeRate: 72, hundreds: 0, fifties: 0 },
    bowlingStats: { matches: 180, innings: 178, wickets: 270, bestBowling: '5/56', average: 24.8, economy: 4.9, fiveWickets: 5 },
    recentBowlingForm: [2, 4, 3, 2, 5],
    iccRanking: { bowling: 2 },
  },
];

const matchesData = (teamMap) => [
  {
    matchId: 'M001',
    title: 'India vs Australia - 1st T20I',
    matchType: 'T20I',
    status: 'completed',
    teamA: teamMap['India'],
    teamB: teamMap['Australia'],
    venue: { name: 'Wankhede Stadium', city: 'Mumbai', country: 'India', pitchType: 'batting-friendly' },
    tossWinner: teamMap['India'],
    tossDecision: 'bat',
    weather: { condition: 'sunny', temperatureCelsius: 32, humidity: 65 },
    scorecard: {
      teamA: { runs: 197, wickets: 5, overs: 20 },
      teamB: { runs: 183, wickets: 8, overs: 20 },
    },
    winner: teamMap['India'],
    resultDescription: 'India won by 14 runs',
    scheduledAt: new Date('2024-01-15T19:00:00Z'),
    completedAt: new Date('2024-01-15T23:15:00Z'),
    series: 'India vs Australia T20I Series 2024',
  },
  {
    matchId: 'M002',
    title: 'Australia vs England - 2nd ODI',
    matchType: 'ODI',
    status: 'completed',
    teamA: teamMap['Australia'],
    teamB: teamMap['England'],
    venue: { name: 'Melbourne Cricket Ground', city: 'Melbourne', country: 'Australia', pitchType: 'pace-friendly' },
    tossWinner: teamMap['Australia'],
    tossDecision: 'field',
    weather: { condition: 'cloudy', temperatureCelsius: 22, humidity: 55 },
    scorecard: {
      teamA: { runs: 312, wickets: 6, overs: 50 },
      teamB: { runs: 298, wickets: 10, overs: 49.2 },
    },
    winner: teamMap['Australia'],
    resultDescription: 'Australia won by 14 runs',
    scheduledAt: new Date('2024-01-20T09:00:00Z'),
    completedAt: new Date('2024-01-20T17:30:00Z'),
    series: 'Ashes ODI Series 2024',
  },
  {
    matchId: 'M003',
    title: 'India vs South Africa - 1st Test',
    matchType: 'Test',
    status: 'upcoming',
    teamA: teamMap['India'],
    teamB: teamMap['South Africa'],
    venue: { name: 'Newlands Cricket Ground', city: 'Cape Town', country: 'South Africa', pitchType: 'bowling-friendly' },
    weather: { condition: 'overcast' },
    scheduledAt: new Date('2025-06-01T09:00:00Z'),
    series: 'India Tour of South Africa 2025',
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  logger.info('Connected to MongoDB for seeding');

  // Clear existing data
  await Promise.all([
    Team.deleteMany({}),
    Player.deleteMany({}),
    Match.deleteMany({}),
  ]);
  logger.info('Cleared existing data');

  // Seed teams
  const teams = await Team.insertMany(teamsData);
  const teamMap = Object.fromEntries(teams.map((t) => [t.name, t._id]));
  logger.info(`Seeded ${teams.length} teams`);

  // Seed players
  const players = await Player.insertMany(playersData(teamMap));
  logger.info(`Seeded ${players.length} players`);

  // Add players to teams
  for (const player of players) {
    await Team.findByIdAndUpdate(player.team, { $addToSet: { players: player._id } });
  }

  // Seed matches
  const matches = await Match.insertMany(matchesData(teamMap));
  logger.info(`Seeded ${matches.length} matches`);

  logger.info('✅ Database seeded successfully!');
  logger.info('Team IDs for testing:');
  teams.forEach((t) => logger.info(`  ${t.name}: ${t._id}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seeding failed:', err);
  process.exit(1);
});
