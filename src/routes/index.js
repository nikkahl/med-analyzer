
import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

// всі роути в auth.routes.js будуть доступні
// за префіксом /auth (тобто /api/auth/register)
router.use('/auth', authRoutes);

export default router;