import express from 'express';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import { Doc, Audit } from '../models.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { confirmSchema } from '../utils/validators.js';
import { encryptBuffer, decryptBuffer } from '../services/encryption.js';
import { extractDoc } from '../services/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, and WebP files are allowed.'));
    }
  },
});

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Please choose a document to upload.' });
  }

  const personId = req.body.personId || null;
  const encrypted = encryptBuffer(file.buffer);
  const storedAs = `${crypto.randomUUID()}.enc`;
  fs.writeFileSync(path.join(uploadDir, storedAs), encrypted);

  let extracted = {};
  try {
    extracted = await extractDoc(file.buffer, file.mimetype);
  } catch (error) {
    console.error('AI extraction failed in upload route:', error.message);
  }

  const document = await Doc.create({
    userId: req.userId,
    personId,
    fileName: file.originalname,
    mime: file.mimetype,
    storedAs,
    type: extracted.type || 'other',
    extracted: extracted || {},
    expiryDate: extracted.expiryDate ? new Date(extracted.expiryDate) : null,
    confirmed: false,
    alerted: [],
  });

  return res.status(201).json(document);
}));

router.put('/:id/confirm', authenticate, asyncHandler(async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide valid document fields to save.' });
  }

  const document = await Doc.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const extracted = parsed.data.extracted || {};
  const normalized = {
    ...extracted,
    type: parsed.data.type,
    number: extracted.number && extracted.type === 'aadhaar' ? `XXXX XXXX ${String(extracted.number).replace(/\D/g, '').slice(-4).padStart(4, '0')}` : extracted.number,
  };

  document.type = parsed.data.type;
  document.extracted = normalized;
  document.confirmed = true;
  document.expiryDate = normalized.expiryDate ? new Date(normalized.expiryDate) : null;
  document.alerted = [];
  await document.save();

  return res.json(document);
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const docs = await Doc.find({ userId: req.userId }).sort({ createdAt: -1 });
  return res.json(docs);
}));

router.get('/:id/file', authenticate, asyncHandler(async (req, res) => {
  const document = await Doc.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const filePath = path.join(uploadDir, document.storedAs);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Saved document file is unavailable.' });
  }

  const safeBuffer = fs.readFileSync(filePath);
  const decrypted = decryptBuffer(safeBuffer);

  await Audit.create({
    userId: req.userId,
    actor: 'owner',
    action: 'view_document',
    docId: document._id,
  });

  res.setHeader('Content-Type', document.mime || 'application/octet-stream');
  return res.send(decrypted);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const document = await Doc.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!document) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const filePath = path.join(uploadDir, document.storedAs);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return res.json({ ok: true });
}));

export default router;
