import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { User, Person, Doc, ChecklistProgress, Audit } from '../models.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

const router = express.Router();

router.get('/export', authenticate, asyncHandler(async (req, res) => {
  const [user, persons, docs, progress, audit] = await Promise.all([
    User.findById(req.userId).select('-passwordHash'),
    Person.find({ userId: req.userId }),
    Doc.find({ userId: req.userId }),
    ChecklistProgress.find({ userId: req.userId }),
    Audit.find({ userId: req.userId }),
  ]);

  return res.json({ user, persons, docs, progress, audit });
}));

router.delete('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const docs = await Doc.find({ userId });

  for (const doc of docs) {
    const filePath = path.join(uploadDir, doc.storedAs);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await Promise.all([
    User.findByIdAndDelete(userId),
    Person.deleteMany({ userId }),
    Doc.deleteMany({ userId }),
    ChecklistProgress.deleteMany({ userId }),
    Audit.deleteMany({ userId }),
  ]);

  return res.json({ ok: true, message: 'Your account and vault data have been removed.' });
}));

export default router;
