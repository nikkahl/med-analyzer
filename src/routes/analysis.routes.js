import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth.middleware.js';
import AnalysisController from '../controllers/analysis.controller.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  '/upload',
  authMiddleware,
  upload.single('analysisImage'),
  AnalysisController.uploadAnalysis
);

router.get(
  '/history',
  authMiddleware, 
  AnalysisController.getHistory
);

export default router;