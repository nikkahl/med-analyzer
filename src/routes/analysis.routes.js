import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth.middleware.js';
import AnalysisController from '../controllers/analysis.controller.js';

const router = Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid file type. Only JPEG and PNG are allowed.';
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, 
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

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