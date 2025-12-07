// src/controllers/auth.controller.js

import AuthService from '../services/auth.service.js';

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const userData = await AuthService.register(email, password);

        return res.status(201).json({ message: 'User registered successfully', data: userData });
    } catch (error) {

      return res.status(409).json({ message: error.message });
    }
  }

async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const userData = await AuthService.login(email, password);

      return res.status(200).json({ message: 'Login successful', data: userData });

    } catch (error) {
      return res.status(401).json({ message: error.message });
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

export default new AuthController();