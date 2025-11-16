// src/controllers/indicator.controller.js

import IndicatorService from '../services/indicator.service.js';

class IndicatorController {
  async createIndicator(req, res) {
    try {
      const indicator = await IndicatorService.create(req.body);
      return res.status(201).json(indicator);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Error creating indicator' });
    }
  }

  async getAllIndicators(req, res) {
    try {
      const indicators = await IndicatorService.getAll();
      return res.status(200).json(indicators);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new IndicatorController();