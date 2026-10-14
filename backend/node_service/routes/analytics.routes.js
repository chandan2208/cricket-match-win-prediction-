'use strict';

const router = require('express').Router();
const { param } = require('express-validator');
const { teamAnalytics, playerAnalytics, systemAnalytics } = require('../controllers/analytics.controller');

router.get('/system', systemAnalytics);
router.get('/team/:id', [param('id').isMongoId().withMessage('Invalid team ID')], teamAnalytics);
router.get('/player/:id', [param('id').isMongoId().withMessage('Invalid player ID')], playerAnalytics);

module.exports = router;
