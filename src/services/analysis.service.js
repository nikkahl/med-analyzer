// src/services/analysis.service.js

import Analysis from '../models/analysis.model.js';
import logger from '../logger.js';

class AnalysisService {
  /**
   * @param {string} userId - ID 
   * @param {Object} data - Дані 
   * @returns {Promise<Document>} 
   */
  async create(userId, data) {
    try {
      const { rawOcrText, parsedData, originalFilePath} = data;
      const anonymizedText = anonymizeRawText(rawOcrText);
      const newAnalysis = new Analysis({
        userId,
        originalFilePath,
        rawOcrText: anonymizedText, 
        indicators: parsedData,
      });

      await newAnalysis.save();
      logger.info(`New analysis saved for user ${userId}`);
      return newAnalysis;

    } catch (error) {
      logger.error('Error saving analysis to database', error);
      throw new Error('Could not save analysis.');
    }
  }

  /**
   * Отримує всі аналізи для конкретного користувача
   * @param {string} userId - ID користувача
   * @returns {Promise<Array<Document>>} - Масив аналізів
   */
  async getAllForUser(userId) {
    try {
      const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 });
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