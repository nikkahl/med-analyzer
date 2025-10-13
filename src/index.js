// src/index.js

require('dotenv').config();
const express = require('express');
const logger = require('./logger'); // Імпортовано логер

const { PORT, MONGO_URI } = process.env;

if (!PORT || !MONGO_URI) {
  // ---- 
  logger.log({
    level: 'error',
    message: 'Missing required environment variables. Check your .env file.'
  });
  process.exit(1);
}

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from configured Express server!');
});

app.listen(PORT, () => {
  // ----
  logger.log({
    level: 'info',
    message: `Server is running on port ${PORT}`
  });
});