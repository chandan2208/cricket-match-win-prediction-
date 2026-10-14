'use strict';

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const {
  predict,
  getPredictionById,
  getPredictionHistory,
  resolveAccuracy,
  getAccuracy,
} = require('../controllers/prediction.controller');

// Validator for prediction input
const predictValidator = [
  body('teamA')
    .notEmpty().withMessage('teamA is required')
    .isMongoId().withMessage('teamA must be a valid MongoDB ID'),
  body('teamB')
    .notEmpty().withMessage('teamB is required')
    .isMongoId().withMessage('teamB must be a valid MongoDB ID')
    .custom((val, { req }) => {
      if (val === req.body.teamA) throw new Error('teamA and teamB must be different');
      return true;
    }),
  body('pitch_condition')
    .notEmpty().withMessage('pitch_condition is required')
    .isIn(['batting-friendly', 'bowling-friendly', 'spin-friendly', 'pace-friendly', 'neutral'])
    .withMessage('Invalid pitch_condition'),
  body('weather')
    .notEmpty().withMessage('weather is required')
    .isIn(['sunny', 'cloudy', 'overcast', 'rainy', 'windy', 'humid'])
    .withMessage('Invalid weather condition'),
  body('toss_winner')
    .notEmpty().withMessage('toss_winner is required')
    .isMongoId().withMessage('toss_winner must be a valid MongoDB ID')
    .custom((val, { req }) => {
      if (val !== req.body.teamA && val !== req.body.teamB) {
        throw new Error('toss_winner must be either teamA or teamB');
      }
      return true;
    }),
  body('toss_decision')
    .notEmpty().withMessage('toss_decision is required')
    .isIn(['bat', 'field']).withMessage('toss_decision must be bat or field'),
  body('match_type')
    .optional()
    .isIn(['Test', 'ODI', 'T20', 'T20I', 'IPL', 'Other'])
    .withMessage('Invalid match_type'),
  body('venue')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 }),
  body('match_id')
    .optional()
    .isMongoId().withMessage('match_id must be a valid MongoDB ID'),
];

const resolveValidator = [
  param('id').isMongoId().withMessage('Invalid prediction ID'),
  body('actual_winner_id').notEmpty().isMongoId().withMessage('actual_winner_id must be a valid MongoDB ID'),
  body('actual_winner_name').notEmpty().isString().trim(),
];

/**
 * @swagger
 * /predictions:
 *   post:
 *     summary: Generate a match win probability prediction
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PredictRequest'
 *     responses:
 *       201:
 *         description: Prediction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictResponse'
 */
router.post('/', predictValidator, predict);

router.get('/accuracy', getAccuracy);
router.get('/history', getPredictionHistory);
router.get('/:id', [param('id').isMongoId()], getPredictionById);
router.patch('/:id/resolve', resolveValidator, resolveAccuracy);

module.exports = router;
