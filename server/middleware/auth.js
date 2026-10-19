import jwt from 'jsonwebtoken';
import { User } from '../models.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.uid).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export function signToken(user) {
  return jwt.sign({ uid: user._id.toString() }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });
}
