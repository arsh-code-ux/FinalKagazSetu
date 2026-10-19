import express from 'express';
import fs from 'node:fs';

import { Doc, Audit, ChecklistProgress } from '../models.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const deathTemplate = JSON.parse(
  fs.readFileSync(new URL('../templates/death.json', import.meta.url), 'utf8')
);

const router = express.Router();

router.get('/expiring', authenticate, asyncHandler(async (req, res) => {
  const docs = await Doc.find({
    userId: req.userId,
    confirmed: true,
    expiryDate: { $ne: null },
  }).sort({ expiryDate: 1 });

  const payload = docs.map((doc) => {
    const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);
    return {
      ...doc.toObject(),
      daysLeft,
    };
  });

  return res.json(payload);
}));

router.get('/events/death', authenticate, asyncHandler(async (req, res) => {
  const docs = await Doc.find({ userId: req.userId, confirmed: true });
  const progress = await ChecklistProgress.findOne({ userId: req.userId, event: 'death' });
  const doneSteps = progress?.doneSteps || [];

  const steps = deathTemplate.steps.map((step) => {
    const matched = docs.filter((doc) => (step.needs || []).includes(doc.type));
    const ready = matched.length > 0;
    const status = ready ? 'ready' : 'missing';

    return {
      id: step.id,
      title: step.title,
      instruction: step.instruction,
      needs: step.needs || [],
      status,
      matched: matched.map((doc) => ({
        id: doc._id,
        type: doc.type,
        holderName: doc.extracted?.holderName || 'Document',
        nominee: doc.extracted?.nominee || null,
      })),
      done: doneSteps.includes(step.id),
    };
  });

  return res.json({
    note: deathTemplate.note,
    title: deathTemplate.title,
    steps,
  });
}));

router.put('/events/death/progress', authenticate, asyncHandler(async (req, res) => {
  const { doneSteps } = req.body || {};
  const progress = await ChecklistProgress.findOneAndUpdate(
    { userId: req.userId, event: 'death' },
    { userId: req.userId, event: 'death', doneSteps: Array.isArray(doneSteps) ? doneSteps : [] },
    { upsert: true, new: true }
  );

  return res.json(progress);
}));

router.get('/audit', authenticate, asyncHandler(async (req, res) => {
  const logs = await Audit.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100);
  return res.json(logs);
}));

export default router;
