import 'dotenv/config';
import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import logger from './logger.js';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import analysisRoutes from './routes/analysis.routes.js';
import indicatorRoutes from './routes/indicator.routes.js';

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

// =========================================================
// НАЛАШТУВАННЯ СТАТИЧНИХ ФАЙЛІВ 
// =========================================================
const publicPath = path.join(process.cwd(), 'public');

// Логуємо шлях для перевірки (подивись це в терміналі після запуску)
console.log('📂 Serving static files from:', publicPath);

// Робимо папку public доступною для браузера
app.use(express.static(publicPath));

// =========================================================
// РОУТИ
// =========================================================

app.use('/api', apiRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/indicators', indicatorRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

// =========================================================
// ЗАПУСК СЕРВЕРА
// =========================================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.log({
      level: 'info',
      message: `Server is running on port ${PORT}`
    });
  });
}

export default app;