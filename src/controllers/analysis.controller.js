// src/controllers/analysis.controller.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OcrService from '../services/ocr.service.js'; 
import ParserService from '../services/parser.service.js';
import AnalysisService from '../services/analysis.service.js';
import logger from '../logger.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnalysisController {

  async uploadAnalysis(req, res) {
    try {
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не завантажено' });
      }
      if (!req.user) {
        return res.status(401).json({ message: 'Користувач не авторизований' });
      }

      const userId = req.user.id;
      logger.info(`Отримано файл від ${req.user.email}. Починаємо OCR...`);

      const rawText = await OcrService.recognize(req.file.buffer);
      const parsedIndicators = ParserService.parse(rawText);

      const uploadsDir = path.join(__dirname, '../../public/uploads');
      
      if (!fs.existsSync(uploadsDir)){
          fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `analysis-${userId}-${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, fileName);
      
      await fs.promises.writeFile(filePath, req.file.buffer);

      const dbPath = `uploads/${fileName}`;

      const analysisData = {
        originalFilePath: dbPath, 
        rawOcrText: rawText,
        parsedData: parsedIndicators
      };

      const savedAnalysis = await AnalysisService.create(userId, analysisData);

      return res.status(201).json({ 
        message: 'Аналіз успішно оброблено та збережено',
        data: savedAnalysis
      });

    } catch (error) {
      logger.error('Error in uploadAnalysis controller:', error);
      return res.status(500).json({ message: 'Помилка сервера при обробці файлу' });
    }
  }

  async getHistory(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const userId = req.user.id;

      const analyses = await AnalysisService.getAllForUser(userId);
      return res.status(200).json({
        message: 'Історія отримана',
        data: analyses
      });

    } catch (error) {
      logger.error('Error in getHistory controller:', error);
      return res.status(500).json({ message: 'Помилка отримання історії' });
    }
  }

  async updateIndicator(req, res) {
    try {
      const { analysisId, indicatorId } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({ message: 'Value is required' });
      }

      const updatedAnalysis = await AnalysisService.updateIndicatorValue(analysisId, indicatorId, value);
      
      return res.status(200).json({
        message: 'Value updated',
        data: updatedAnalysis
      });
    } catch (error) {
      logger.error('Error updating indicator:', error);
      return res.status(500).json({ message: 'Error updating value' });
    }
  }
}

export default new AnalysisController();