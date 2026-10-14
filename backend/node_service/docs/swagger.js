'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🏏 Cricket Match Prediction API',
      version: '1.0.0',
      description: `
Production-level REST API for cricket match win probability prediction.
Uses a Gradient Boosting ML model (Python microservice) with features including:
team strength, recent form, venue stats, H2H record, toss advantage, and weather/pitch conditions.
      `,
      contact: { name: 'API Support', email: 'support@cricketpredict.io' },
    },
    servers: [
      { url: '/api', description: 'Production' },
    ],
    tags: [
      { name: 'Predictions', description: 'ML-powered match win probability' },
      { name: 'Matches', description: 'Match data (live, history, upcoming)' },
      { name: 'Analytics', description: 'Team & player deep analytics' },
      { name: 'Teams', description: 'Team management' },
      { name: 'Players', description: 'Player management' },
    ],
    components: {
      schemas: {
        PredictRequest: {
          type: 'object',
          required: ['teamA', 'teamB', 'pitch_condition', 'weather', 'toss_winner', 'toss_decision'],
          properties: {
            teamA: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c001', description: 'MongoDB ObjectId of Team A' },
            teamB: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c002', description: 'MongoDB ObjectId of Team B' },
            pitch_condition: {
              type: 'string',
              enum: ['batting-friendly', 'bowling-friendly', 'spin-friendly', 'pace-friendly', 'neutral'],
              example: 'batting-friendly',
            },
            weather: {
              type: 'string',
              enum: ['sunny', 'cloudy', 'overcast', 'rainy', 'windy', 'humid'],
              example: 'sunny',
            },
            toss_winner: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c001' },
            toss_decision: { type: 'string', enum: ['bat', 'field'], example: 'bat' },
            match_type: { type: 'string', enum: ['Test', 'ODI', 'T20', 'T20I', 'IPL', 'Other'], example: 'T20' },
            venue: { type: 'string', example: 'Wankhede Stadium' },
            match_id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c099' },
          },
        },
        PredictResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Prediction generated successfully' },
            data: {
              type: 'object',
              properties: {
                predictionId: { type: 'string' },
                teamA: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'India' },
                    winProbability: { type: 'number', example: 67.3 },
                  },
                },
                teamB: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Australia' },
                    winProbability: { type: 'number', example: 32.7 },
                  },
                },
                predictedWinner: { type: 'string', example: 'India' },
                confidence: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
                keyFactors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      factor: { type: 'string', example: 'Team Strength Differential' },
                      description: { type: 'string' },
                      impact: { type: 'string', enum: ['positive_A', 'positive_B', 'neutral'] },
                      weight: { type: 'number', example: 0.312 },
                    },
                  },
                },
                modelVersion: { type: 'string', example: '1.0.0' },
                generatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Invalid input',
          content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } } } },
        },
        NotFound: {
          description: 'Resource not found',
        },
        ServerError: {
          description: 'Internal server error',
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
