// src/logger.js

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // Записувати логи рівня 'info' і вище ('warn', 'error')
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Записувати логи у форматі JSON
  ),
  transports: [
    // Записувати помилки у файл error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Записувати всі логи у файл combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Якщо ми не в "production" режимі, також виводити логи в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;