
import Indicator from '../models/indicator.model.js';
import logger from '../logger.js';

class IndicatorService {

  async create(indicatorData) {
    try {
      const { name, aliases, units } = indicatorData;

      const existing = await Indicator.findOne({ name });
      if (existing) {
        throw new Error('Indicator with this name already exists');
      }

      const indicator = new Indicator({ name, aliases, units });
      await indicator.save();

      logger.info(`Indicator created: ${name}`);
      return indicator;
    } catch (error) {
      logger.error('Error creating indicator', error);
      throw error;
    }
  }


  async getAll() {
    try {
      const indicators = await Indicator.find().sort({ name: 1 });
      return indicators;
    } catch (error) {
      logger.error('Error fetching all indicators', error);
      throw new Error('Could not fetch indicators');
    }
  }

  
}

export default new IndicatorService();