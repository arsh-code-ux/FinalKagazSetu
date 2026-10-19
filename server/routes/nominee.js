import express from 'express';
import crypto from 'crypto';

import { User, Doc, Audit } from '../models.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { nomineeSchema } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  return res.json(user.nominee || {});
}));

router.put('/', authenticate, asyncHandler(async (req, res) => {
  const parsed = nomineeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide valid nominee details.' });
  }

  const user = await User.findById(req.userId);
  const nominee = {
    ...user.nominee,
    name: parsed.data.name ?? user.nominee?.name ?? '',
    email: parsed.data.email ?? user.nominee?.email ?? '',
    delayDays: parsed.data.delayDays ?? user.nominee?.delayDays ?? 90,
    waitDays: parsed.data.waitDays ?? user.nominee?.waitDays ?? 7,
    warnedAt: null,
    notifiedAt: null,
    token: null,
  };

  user.nominee = nominee;
  await user.save();
  return res.json(user.nominee);
}));

router.get('/emergency/:token', asyncHandler(async (req, res) => {
  const user = await User.findOne({ 'nominee.token': req.params.token });
  if (!user || !user.nominee?.notifiedAt) {
    return res.status(404).json({ error: 'This emergency link is invalid or not active yet.' });
  }

  const accessibleAt = new Date(user.nominee.notifiedAt.getTime() + user.nominee.waitDays * 86400000);
  if (new Date() < accessibleAt) {
    return res.status(403).json({ error: `This emergency access opens on ${accessibleAt.toISOString().slice(0, 10)}.` });
  }

  const docs = await Doc.find({ userId: user._id, confirmed: true });
  await Audit.create({
    userId: user._id,
    actor: `nominee:${user.nominee.email}`,
    action: 'emergency_view',
    docId: null,
  });

  return res.json({
    owner: user.name,
    docs: docs.map((doc) => ({
      id: doc._id,
      type: doc.type,
      fileName: doc.fileName,
      extracted: doc.extracted,
      expiryDate: doc.expiryDate,
    })),
  });
}));

export default router;
