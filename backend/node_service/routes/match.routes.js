'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const {
  getLiveMatches,
  getMatchHistory,
  getUpcomingMatches,
  getMatchById,
  createMatch,
  updateMatchStatus,
} = require('../controllers/match.controller');

const matchCreateValidator = [
  body('title').notEmpty().trim().isLength({ max: 200 }),
  body('matchType').isIn(['Test', 'ODI', 'T20', 'T20I', 'IPL', 'Other']),
  body('teamA').isMongoId(),
  body('teamB').isMongoId(),
  body('venue.name').notEmpty().trim(),
  body('venue.city').notEmpty().trim(),
  body('venue.country').notEmpty().trim(),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO date'),
];

router.get('/live', getLiveMatches);
router.get('/history', getMatchHistory);
router.get('/upcoming', getUpcomingMatches);
router.get('/:id', [param('id').isMongoId()], getMatchById);
router.post('/', matchCreateValidator, createMatch);
router.patch('/:id/status', [param('id').isMongoId()], updateMatchStatus);

module.exports = router;
