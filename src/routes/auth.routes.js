import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

// Коли приходить POST-запит на /api/auth/register,
// викликати метод register з AuthController
router.post('/register', AuthController.register);

export default router;