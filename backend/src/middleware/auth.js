import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });

    req.userId = user._id.toString();
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
