import express from 'express';

import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { runExpiry, runDeadman } from '../jobs.js';

const router = express.Router();

router.post('/run-jobs', authenticate, asyncHandler(async (_, res) => {
  await Promise.all([runExpiry(), runDeadman()]);
  return res.json({ ok: true, message: 'Cron jobs executed manually.' });
}));

export default router;
