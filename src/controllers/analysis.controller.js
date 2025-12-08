import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OcrService from '../services/ocr.service.js'; 
import ParserService from '../services/parser.service.js';
import AnalysisService from '../services/analysis.service.js';
import Analysis from '../models/analysis.model.js';
import logger from '../logger.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnalysisController {

  async uploadAnalysis(req, res) {
    try {
      if (req.fileValidationError) return res.status(400).json({ message: req.fileValidationError });
      if (!req.file) return res.status(400).json({ message: 'Файл не завантажено' });
      if (!req.user) return res.status(401).json({ message: 'Користувач не авторизований' });

      const userId = req.user._id || req.user.id;
      logger.info(`Отримано файл від user: ${userId}`);

      const rawText = await OcrService.recognize(req.file.buffer);
      const parsedIndicators = ParserService.parse(rawText);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fileName = `analysis-${userId}-${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(filePath, req.file.buffer);

      const dbPath = `/uploads/${fileName}`;

      const analysisData = {
        originalFilePath: dbPath, 
        rawOcrText: rawText,
        parsedData: parsedIndicators
      };

      const savedAnalysis = await AnalysisService.create(userId, analysisData);

      const responseData = savedAnalysis.toObject();
      if (!responseData.indicators || responseData.indicators.length === 0) {
          responseData.indicators = responseData.parsedData || parsedIndicators;
      }

      return res.status(201).json({ 
        message: 'Аналіз успішно оброблено',
        data: responseData
      });

    } catch (error) {
      logger.error('Error in uploadAnalysis:', error);
      return res.status(500).json({ message: 'Помилка обробки' });
    }
  }

  async getHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20; 
      const skip = (page - 1) * limit;
      const userId = req.user._id || req.user.id;

      const analyses = await Analysis.find({ user: userId }) 
          .sort({ createdAt: -1 }) 
          .skip(skip)
          .limit(limit);

      const total = await Analysis.countDocuments({ user: userId });

      const mappedAnalyses = analyses.map(a => {
          const obj = a.toObject();
          const safeIndicators = (obj.indicators && obj.indicators.length > 0) 
              ? obj.indicators 
              : (obj.parsedData || []);

          return {
              _id: obj._id,
              createdAt: obj.createdAt,
              status: obj.status || 'completed',
              imageUrl: obj.originalFilePath,
              indicators: safeIndicators 
          };
      });

      res.json({
          data: mappedAnalyses,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      logger.error('Error in getHistory:', error);
      res.status(500).json({ message: 'Помилка історії' });
    }
  }

  async getAnalysisById(req, res) {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) return res.status(404).json({ message: 'Аналіз не знайдено' });
        
        const obj = analysis.toObject();
        if (!obj.indicators || obj.indicators.length === 0) {
            obj.indicators = obj.parsedData || [];
        }

        res.json({ 
            data: {
                ...obj,
                imageUrl: obj.originalFilePath
            }
        });
    } catch (err) {
        logger.error('Error in getAnalysisById:', err);
        res.status(500).json({ message: 'Помилка сервера' });
    }
  }

  async updateIndicator(req, res) {
    try {
      const { analysisId, indicatorId } = req.params;
      const { value } = req.body;
      const updatedAnalysis = await AnalysisService.updateIndicatorValue(analysisId, indicatorId, value);
      return res.status(200).json({ message: 'Value updated', data: updatedAnalysis });
    } catch (error) {
      logger.error('Error updating indicator:', error);
      return res.status(500).json({ message: 'Error updating value' });
    }
  }

  async deleteAnalysis(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        const deletedAnalysis = await Analysis.findOneAndDelete({ _id: id, user: userId });
        
        if (!deletedAnalysis) {
            return res.status(404).json({ message: 'Аналіз не знайдено' });
        }
        return res.status(200).json({ message: 'Аналіз успішно видалено' });
    } catch (error) {
        logger.error('Error in deleteAnalysis:', error);
        return res.status(500).json({ message: 'Помилка сервера' });
    }
  }
}

export default new AnalysisController();
