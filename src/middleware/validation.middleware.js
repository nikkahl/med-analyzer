// src/middleware/validation.middleware.js

import { body, validationResult } from 'express-validator';

export const registerValidators = [
    body('email')
        .isEmail()
        .withMessage('Некоректний формат email адреси'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль має містити мінімум 6 символів'),
];

export const loginValidators = [
    body('email')
        .isEmail()
        .withMessage('Введіть коректний email'),
    body('password')
        .exists()
        .withMessage('Введіть пароль'),
];

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json({ 
            message: firstError,
            errors: errors.array() 
        });
    }
    next();
};