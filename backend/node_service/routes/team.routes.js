'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const { getAllTeams, getTeamById, createTeam, updateTeam, updateTeamForm } = require('../controllers/team.controller');

const teamValidator = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('shortName').notEmpty().trim().isLength({ max: 5 }),
  body('country').notEmpty().trim(),
  body('teamType').isIn(['international', 'ipl', 'domestic', 'bbl', 'other']),
];

router.get('/', getAllTeams);
router.get('/:id', [param('id').isMongoId()], getTeamById);
router.post('/', teamValidator, createTeam);
router.patch('/:id', [param('id').isMongoId()], updateTeam);
router.patch('/:id/form', [param('id').isMongoId(), body('result').isIn(['W', 'L', 'D', 'NR'])], updateTeamForm);

module.exports = router;
