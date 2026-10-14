'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const { getAllPlayers, getPlayerById, createPlayer, updatePlayer, updatePlayerForm } = require('../controllers/player.controller');

const playerValidator = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('country').notEmpty().trim(),
  body('team').isMongoId(),
  body('role').isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper']),
];

router.get('/', getAllPlayers);
router.get('/:id', [param('id').isMongoId()], getPlayerById);
router.post('/', playerValidator, createPlayer);
router.patch('/:id', [param('id').isMongoId()], updatePlayer);
router.patch('/:id/form', [param('id').isMongoId()], updatePlayerForm);

module.exports = router;
