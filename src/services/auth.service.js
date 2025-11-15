// src/services/auth.service.js

import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import 'dotenv/config'; 

class AuthService {
  async register(email, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      passwordHash,
    });

    await newUser.save();

    // 5. СТВОРЕННЯ ТОКЕНА
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } 
    );

    // 6. ПОВЕРТАЄМО ЮЗЕРА І ТОКЕН
    return {
      user: { id: newUser._id, email: newUser.email },
      token,
    };
  }

  async login(email, password) {
    // 1. Знайти користувача за email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials'); 
    }

    // 2. Перевірити пароль
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // 3. Створити і повернути токен (так само, як в реєстрації)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      user: { id: user._id, email: user.email },
      token,
    };
  }
}

export default new AuthService();