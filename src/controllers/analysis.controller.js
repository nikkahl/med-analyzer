import Analysis from '../models/analysis.model.js';
import OcrService from '../services/ocr.service.js';
import ParserService from '../services/parser.service.js';
import logger from '../logger.js';

class AnalysisController {

  async uploadAnalysis(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не завантажено' });
      }

      logger.info(`Початок обробки файлу для користувача: ${req.user.id}`);

      // 1. OCR Розпізнавання
      const rawText = await OcrService.recognize(req.file.buffer);
      
      // 2. Парсинг даних
      const parsedData = ParserService.parse(rawText);

      // 3. Підготовка картинки (Base64)
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // 4. Збереження в БД
      const newAnalysis = new Analysis({
        user: req.user.id,
        imageUrl: dataURI, // Зберігаємо фото
        rawOcrText: rawText,
        indicators: parsedData,
        parsedData: parsedData 
      });

      await newAnalysis.save();

      return res.status(201).json({
        message: 'Аналіз успішно оброблено',
        data: newAnalysis
      });

    } catch (e) {
      logger.error('Помилка в uploadAnalysis:', e);
      return res.status(500).json({ message: 'Помилка обробки аналізу', error: e.message });
    }
  }

  async getHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const analyses = await Analysis.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Analysis.countDocuments({ user: req.user.id });

      res.json({
        data: analyses,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      });
    } catch (e) {
      logger.error(e);
      res.status(500).json({ message: 'Помилка отримання історії' });
    }
  }

  async getAnalysisById(req, res) {
    try {
      const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user.id });
      if (!analysis) {
        return res.status(404).json({ message: 'Аналіз не знайдено' });
      }
      res.json({ data: analysis });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  }
  
  async deleteAnalysis(req, res) {
        try {
            const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user.id });
            if (!analysis) {
                return res.status(404).json({ message: 'Аналіз не знайдено' });
            }
            return res.json({ message: 'Аналіз видалено' });
        } catch (e) {
            logger.error(e);
            return res.status(500).json({ message: 'Помилка видалення' });
        }
    }

    async updateIndicator(req, res) {
       try {
            const { analysisId, indicatorId } = req.params;
            const { value } = req.body;

            const analysis = await Analysis.findOne({ _id: analysisId, user: req.user.id });
            if (!analysis) return res.status(404).json({ message: 'Not found' });

            const indicator = analysis.indicators.id(indicatorId);
            if (!indicator) return res.status(404).json({ message: 'Indicator not found' });

            indicator.value = value;
            await analysis.save();

            return res.json({ message: 'Updated', data: analysis });
        } catch (e) {
            logger.error(e);
            return res.status(500).json({ message: 'Update error' });
        }
    }
}

export default new AnalysisController();