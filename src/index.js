import 'dotenv/config';
import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import logger from './logger.js';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import analysisRoutes from './routes/analysis.routes.js';
import indicatorRoutes from './routes/indicator.routes.js';
import ParserService from './services/parser.service.js';

const { PORT, MONGO_URI } = process.env;

if (!PORT || !MONGO_URI) {
  logger.log({
    level: 'error',
    message: 'Missing required environment variables. Check your .env file.'
  });
  process.exit(1);
}

connectDB();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use('/api', apiRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/indicators', indicatorRoutes);

app.listen(PORT, () => {
  logger.log({
    level: 'info',
    message: `Server is running on port ${PORT}`
  });
});