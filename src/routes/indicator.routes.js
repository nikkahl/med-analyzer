// src/routes/indicator.routes.js

import { Router } from 'express';
import IndicatorController from '../controllers/indicator.controller.js';
import authMiddleware from '../middleware/auth.middleware.js'; 

const router = Router();
router.post('/', authMiddleware, IndicatorController.createIndicator);
router.get('/', authMiddleware, IndicatorController.getAllIndicators);

export default router;