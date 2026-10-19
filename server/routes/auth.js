import express from 'express';
import bcrypt from 'bcryptjs';

import { User, Person } from '../models.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { userSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and password.' });
  }

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    lastLoginAt: new Date(),
    nominee: {
      name: '',
      email: '',
      delayDays: 90,
      waitDays: 7,
      token: null,
      warnedAt: null,
      notifiedAt: null,
    },
  });

  await Person.create({
    userId: user._id,
    name,
    relation: 'self',
    dob: null,
  });

  return res.status(201).json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email },
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success || !req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const email = String(req.body.email).toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash || typeof user.passwordHash !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(String(req.body.password), user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  user.lastLoginAt = new Date();
  user.nominee = {
    ...user.nominee,
    warnedAt: null,
    notifiedAt: null,
    token: null,
  };
  await user.save();

  return res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email },
  });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      lastLoginAt: req.user.lastLoginAt,
    },
  });
}));

export default router;
