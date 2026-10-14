'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.NODE_ENV === 'test'
    ? process.env.MONGODB_URI_TEST
    : process.env.MONGODB_URI;

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  };

  const isPlaceholderUri = uri && (uri.includes('anything:anything') || uri.includes('cluster0.zuiaxqh.mongodb.net'));

  if (uri && !isPlaceholderUri) {
    try {
      logger.info(`Attempting to connect to MongoDB URI...`);
      const conn = await mongoose.connect(uri, options);
      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return conn;
    } catch (error) {
      logger.warn(`Primary MongoDB connection failed (${error.message}). Switching to in-memory MongoDB...`);
    }
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memUri = mongodInstance.getUri();
    logger.info(`Starting in-memory MongoDB instance at ${memUri}...`);

    const conn = await mongoose.connect(memUri);
    logger.info(`In-memory MongoDB successfully connected!`);

    // Auto-seed in-memory DB so API endpoints have mock cricket data
    try {
      const { seedData } = require('../scripts/seed_helper');
      await seedData();
      logger.info(`Default cricket data seeded successfully into in-memory DB!`);
    } catch (seedErr) {
      logger.warn(`Auto-seeding warning: ${seedErr.message}`);
    }

    return conn;
  } catch (memError) {
    logger.error(`Failed to initialize in-memory MongoDB: ${memError.message}`);
    throw memError;
  }
};

module.exports = connectDB;

