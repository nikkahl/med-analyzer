import 'dotenv/config';
import express from 'express';
import path from 'path'; 
import logger from './logger.js';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js'; 

const { PORT = 3000, MONGO_URI } = process.env;

if (!MONGO_URI) {
  logger.warn('MONGO_URI is missing in .env file');
}

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));
logger.info(` Serving static files from: ${publicPath}`);

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Local: http://localhost:${PORT}`);
  });
}

export default app;