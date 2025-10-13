// src/controllers/auth.controller.js

import AuthService from '../services/auth-temp.js';

class AuthController {
  async register(req, res) {
    try {
      // витяг email та пароль з тіла запиту (req.body)
      const { email, password } = req.body;

      // перевірка чи всі дані ок на місці
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // виклик сервісу для реєстрації користувача
      const userData = await AuthService.register(email, password);

      // відправка успішної відповіді
      return res.status(201).json({ message: 'User registered successfully', user: userData });

    } catch (error) {
      // обробка можливої помилки 
      return res.status(409).json({ message: error.message });
    }
  }
}

export default new AuthController();