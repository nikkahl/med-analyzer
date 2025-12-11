import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import logger from '../logger.js';

class AuthController {

    async registration(req, res) {
        try {
            console.log('🔥 [DEBUG] Реєстрація...');
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Помилка валідації', errors: errors.array() });
            }

            const { email, password } = req.body;
            const candidate = await User.findOne({ email });

            if (candidate) {
                return res.status(400).json({ message: 'Такий користувач вже існує' });
            }

            const hashPassword = await bcrypt.hash(password, 7);
            
            // --- ВИПРАВЛЕННЯ ТУТ ---
            // Було: const user = new User({ email, password: hashPassword });
            // Стало (як хоче база):
            const user = new User({ 
                email, 
                passwordHash: hashPassword 
            });
            
            await user.save();
            return res.json({ message: 'Користувач зареєстрований' });

        } catch (e) {
            console.error('❌ [DEBUG] Error:', e);
            res.status(400).json({ message: 'Registration error', error: e.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(400).json({ message: 'Користувача не знайдено' });
            }

            const validPassword = bcrypt.compareSync(password, user.passwordHash);
            
            if (!validPassword) {
                return res.status(400).json({ message: 'Невірний пароль' });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });
            return res.json({ token, user: { id: user._id, email: user.email } });
        } catch (e) {
            console.error(e);
            res.status(400).json({ message: 'Login error' });
        }
    }
}

export default new AuthController();