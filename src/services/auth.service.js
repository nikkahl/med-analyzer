// src/services/auth.service.js

import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

class AuthService {
  async register(email, password) {
    // 1. Перевірка, чи існує користувач з таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Викидаємо помилку, яку потім перехопимо в контролері
      throw new Error('User with this email already exists');
    }

    // Хешування 
    const salt = await bcrypt.genSalt(10); // "Сіль" 
    const passwordHash = await bcrypt.hash(password, salt);

    // створення нового користувача
    const newUser = new User({
      email,
      passwordHash,
    });

    // зберігає користувача в базі даних
    await newUser.save();

    // повертає створеного користувача (без хешу пароля)
    return { id: newUser._id, email: newUser.email };
  }
}

// Експорт екземпляру класу
export default new AuthService();