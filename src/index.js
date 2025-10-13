// src/index.js

import 'dotenv/config'; 
import express from 'express';
import logger from './logger.js'; 
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';

const { PORT, MONGO_URI } = process.env;

// перевірка змінних середовища
if (!PORT || !MONGO_URI) {
  logger.log({
    level: 'error',
    message: 'Missing required environment variables. Check your .env file.'
  });
  process.exit(1);
}

// підключення до бд
connectDB(); //  виклик функції для підключення до MongoDB

const app = express();


// Middleware для розбору JSON-тіла запитів
app.use(express.json()); 


app.get('/', (req, res) => {
  res.send('Hello from configured Express server!');
});


// підключення основного роутера до шляху /api
app.use('/api', apiRoutes);


app.listen(PORT, () => {
  logger.log({
    level: 'info',
    message: `Server is running on port ${PORT}`
  });
});