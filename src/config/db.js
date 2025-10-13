// src/config/db.js

const mongoose = require('mongoose');
const logger = require('../logger'); 
const connectDB = async () => {
  try {
    
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      logger.error('MONGO_URI is not defined in the environment variables.');
      process.exit(1); //  перевірка, що зупинитить застосунок, якщо не задати змінну
    }

    await mongoose.connect(mongoURI);

    logger.info('MongoDB Connected...');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    // вихід з процесу з помилкою
    process.exit(1);
  }
};

module.exports = connectDB;