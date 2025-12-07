// src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import 'dotenv/config';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || (decoded.user && decoded.user.id);
    
    const user = await User.findById(userId);
    if (!user) {
         return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = { id: user._id, email: user.email };
    next();

  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;