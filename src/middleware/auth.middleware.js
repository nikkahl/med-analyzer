import jwt from 'jsonwebtoken';
import 'dotenv/config';


const authMiddleware = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }
  
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);

  
    req.user = decodedUserData;

    next();

  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;