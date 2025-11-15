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

      return res.status(201).json({ message: 'User registered successfully', user: userData });

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
};

export default new AuthController();