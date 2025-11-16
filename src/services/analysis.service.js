import Analysis from '../models/analysis.model.js';
import logger from '../logger.js';

class AnalysisService {
  /**
   * @param {string} userId - ID 
   * @param {Object} data - Дані 
   * @returns {Promise<Document>} - Збережений документ 
   */
  async create(userId, data) {
    try {
      const { rawOcrText, parsedData } = data;

      const newAnalysis = new Analysis({
        userId,
        rawOcrText,
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
}

export default new AnalysisService();