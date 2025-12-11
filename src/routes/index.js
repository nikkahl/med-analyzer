import { Router } from 'express';
import authRoutes from './auth.routes.js';
import analysisRoutes from './analysis.routes.js';
import indicatorRoutes from './indicator.routes.js';

const router = Router();

router.use('/auth', authRoutes);         
router.use('/analyses', analysisRoutes); 
router.use('/indicators', indicatorRoutes); 

export default router;