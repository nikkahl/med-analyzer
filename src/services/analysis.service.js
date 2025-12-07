// src/services/analysis.service.js

import Analysis from '../models/analysis.model.js';
import logger from '../logger.js';

class AnalysisService {
  /**
   * @param {string} userId - ID користувача
   * @param {Object} data - Дані аналізу
   * @returns {Promise<Document>} 
   */
  async create(userId, data) {
    try {
      const { rawOcrText, parsedData, originalFilePath } = data;
      const anonymizedText = anonymizeRawText(rawOcrText);

      // ВИПРАВЛЕНО: Використовуємо поле 'user' замість 'userId', щоб відповідало Моделі
      const newAnalysis = new Analysis({
        user: userId, 
        originalFilePath: originalFilePath,
        rawOcrText: anonymizedText,
        // Зберігаємо розпарсені дані і в indicators (для Mongoose схеми), і в parsedData (як резерв)
        indicators: parsedData,
        parsedData: parsedData 
      });

      const savedDoc = await newAnalysis.save();
      logger.info(`New analysis saved for user ${userId}. ID: ${savedDoc._id}`);
      return savedDoc;

    } catch (error) {
      logger.error('Error saving analysis to database', error);
      // Важливо кинути помилку далі, щоб контролер знав про неї
      throw error; 
    }
  }

  /**
   * Отримує всі аналізи для конкретного користувача
   * @param {string} userId - ID користувача
   * @returns {Promise<Array<Document>>} - Масив аналізів
   */
  async getAllForUser(userId) {
    try {
      // ВИПРАВЛЕНО: Шукаємо по полю 'user', а не 'userId'
      const analyses = await Analysis.find({ user: userId }).sort({ createdAt: -1 });
      return analyses;
    } catch (error) {
      logger.error(`Error fetching analyses for user ${userId}`, error);
      throw new Error('Could not fetch analyses.');
    }
  }

  async updateIndicatorValue(analysisId, indicatorId, newValue) {
    try {
      const analysis = await Analysis.findById(analysisId);
      if (!analysis) throw new Error('Analysis not found');

      // Mongoose метод .id() шукає в масиві сабдокументів
      const indicator = analysis.indicators.id(indicatorId);
      if (!indicator) throw new Error('Indicator not found');

      indicator.value = newValue;
      
      await analysis.save();
      logger.info(`Indicator ${indicator.name} updated to ${newValue}`);
      return analysis;
    } catch (error) {
      logger.error('Error updating indicator', error);
      throw error;
    }
  }
}

function anonymizeRawText(text) {
  if (!text) return "";

  const patientRegex = /.*(Пацієнт|ПІБ|ім'я|Ім'я|Patient|Name|Full Name).*$/gim;
  const replacement = "Пацієнт: [КОНФІДЕНЦІЙНО]";

  return text.replace(patientRegex, replacement);
}

export default new AnalysisService();