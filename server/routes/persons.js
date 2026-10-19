import express from 'express';

import { Person } from '../models.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';
import { personSchema } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const persons = await Person.find({ userId: req.userId }).sort({ createdAt: -1 });
  return res.json(persons);
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const parsed = personSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide a valid name and relation.' });
  }

  const person = await Person.create({
    userId: req.userId,
    name: parsed.data.name,
    relation: parsed.data.relation,
    dob: parsed.data.dob || null,
  });

  return res.status(201).json(person);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const parsed = personSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide valid family member details.' });
  }

  const person = await Person.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { ...parsed.data, dob: parsed.data.dob || null } },
    { new: true }
  );

  if (!person) {
    return res.status(404).json({ error: 'Family member not found.' });
  }

  return res.json(person);
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const person = await Person.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!person) {
    return res.status(404).json({ error: 'Family member not found.' });
  }

  await Person.deleteMany({ userId: req.userId, _id: req.params.id });
  return res.json({ ok: true });
}));

export default router;
