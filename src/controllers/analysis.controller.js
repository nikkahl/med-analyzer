import OcrService from '../services/ocr.service.js'; 
import ParserService from '../services/parser.service.js';
import AnalysisService from '../services/analysis.service.js';
import logger from '../logger.js'; 

class AnalysisController {

  async uploadAnalysis(req, res) {
    try {

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

const userId = req.user.id;

logger.info(`File received from user ${req.user.email}. Starting OCR...`);

const rawText = await OcrService.recognize(req.file.buffer);
const parsedIndicators = ParserService.parse(rawText);

const analysisData = {
        rawOcrText: rawText,
        parsedData: parsedIndicators
      };
      const savedAnalysis = await AnalysisService.create(userId, analysisData);

      return res.status(201).json({ // 201 Created 
        message: 'File processed and saved successfully',
        data: savedAnalysis
      });

    } catch (error) {
      logger.error('Error in uploadAnalysis controller:', error);
      if (error.message.includes('recognize text')) {
        return res.status(500).json({ message: 'Server error during OCR process' });
      }
      if (error.message.includes('save analysis')) {
        return res.status(500).json({ message: 'Server error during analysis save' });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // метод для отримання "Історії"
  async getHistory(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = req.user.id;

      const analyses = await AnalysisService.getAllForUser(userId);
      return res.status(200).json({
        message: 'History fetched successfully',
        data: analyses
      });

    } catch (error) {
      logger.error('Error in getHistory controller:', error);
      return res.status(500).json({ message: 'Error fetching history' });
    }
  }
}

export default new AnalysisController();