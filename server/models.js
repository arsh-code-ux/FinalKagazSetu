import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date, default: Date.now },
    nominee: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      delayDays: { type: Number, default: 90 },
      waitDays: { type: Number, default: 7 },
      token: { type: String, default: null },
      warnedAt: { type: Date, default: null },
      notifiedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.index({ 'nominee.token': 1 });

const personSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    dob: { type: Date, default: null },
  },
  { timestamps: true }
);

const docSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
    fileName: { type: String, required: true },
    mime: { type: String, required: true },
    storedAs: { type: String, required: true },
    type: { type: String, default: 'other' },
    extracted: { type: Schema.Types.Mixed, default: {} },
    expiryDate: { type: Date, default: null },
    confirmed: { type: Boolean, default: false },
    alerted: { type: [Number], default: [] },
  },
  { timestamps: true }
);

docSchema.index({ expiryDate: 1 });

const checklistProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event: { type: String, required: true },
    doneSteps: { type: [String], default: [] },
  },
  { timestamps: true }
);

checklistProgressSchema.index({ userId: 1, event: 1 }, { unique: true });

const auditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    docId: { type: Schema.Types.ObjectId, ref: 'Doc', default: null },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
export const Person = model('Person', personSchema);
export const Doc = model('Doc', docSchema);
export const ChecklistProgress = model('ChecklistProgress', checklistProgressSchema);
export const Audit = model('Audit', auditSchema);
