import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js'; 
import { registerValidators, loginValidators, validateRequest } from '../middleware/validation.middleware.js';

const router = Router();

router.post(
    '/register', 
    registerValidators,
    validateRequest,    
    AuthController.register 
);

router.post(
    '/login', 
    loginValidators,    
    validateRequest,    
    AuthController.login   
);

export default router;