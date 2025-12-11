import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js'; 
import { check } from 'express-validator';

const router = Router();
router.post(
    '/register', 
    [
        check('email', 'Некоректний email').isEmail(),
        check('password', 'Пароль має бути довшим за 4 символи').isLength({ min: 4 })
    ], 
    AuthController.registration
);

router.post('/login', AuthController.login);

export default router;