import cron from 'node-cron';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

import { User, Doc } from './models.js';
import { daysUntil, emergencyAccessOpen } from './utils/dateUtils.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendMail(to, subject, text) {
  if (!to) {
    return;
  }

  if (!transport) {
    console.log(`\n[MAIL -> ${to}] ${subject}\n${text}\n`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_USER || 'kaagazsetu@example.com',
    to,
    subject,
    text,
  });
}

export function startJobs() {
  cron.schedule('0 9 * * *', () => {
    runExpiry();
  });

  cron.schedule('0 10 * * *', () => {
    runDeadman();
  });
}

export async function runExpiry() {
  const docs = await Doc.find({ confirmed: true, expiryDate: { $ne: null } });

  for (const doc of docs) {
    const user = await User.findById(doc.userId);
    if (!user) continue;

    const daysLeft = daysUntil(doc.expiryDate, new Date());

    for (const threshold of [60, 30, 7]) {
      if (daysLeft <= threshold && daysLeft > 0 && !doc.alerted.includes(threshold)) {
        const renewalDraft = doc.type === 'insurance'
          ? `\n\nRenewal Draft\nTo: ${doc.extracted?.issuer || 'Insurer'}\nSubject: Renewal request for policy ${doc.extracted?.number || 'policy'}\nHello, I would like to renew my insurance policy and request the premium, renewal timeline, and required documents.`
          : '';

        await sendMail(
          user.email,
          `${doc.type.toUpperCase()} document expiry in ${daysLeft} days`,
          `Aapki ${doc.type} document ${daysLeft} din mein expire ho rahi hai. Please review and renew on time.${renewalDraft}`
        );

        doc.alerted.push(threshold);
        await doc.save();
      }
    }
  }
}

export async function runDeadman() {
  const users = await User.find({ 'nominee.email': { $ne: '', $exists: true } });

  for (const user of users) {
    const nominee = user.nominee || {};
    const idleDays = Math.max(0, Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / DAY_MS));
    const warningThreshold = Number(nominee.delayDays || 90);
    const waitDays = Number(nominee.waitDays || 7);

    if (idleDays < warningThreshold) {
      user.nominee.warnedAt = null;
      user.nominee.notifiedAt = null;
      user.nominee.token = null;
      await user.save();
      continue;
    }

    if (!user.nominee.warnedAt) {
      user.nominee.warnedAt = new Date();
      await user.save();
      await sendMail(
        user.email,
        'KaagazSetu: aapko ek chhota check-in chahiye',
        `Aap ${idleDays} din se active nahi hain. Agar aap ${waitDays} din aur login nahi karte, to nominee ko emergency access diya jayega.`
      );
      continue;
    }

    if (!user.nominee.notifiedAt && Date.now() - new Date(user.nominee.warnedAt).getTime() > waitDays * DAY_MS) {
      const token = crypto.randomBytes(24).toString('hex');
      user.nominee.notifiedAt = new Date();
      user.nominee.token = token;
      await user.save();

      await sendMail(
        nominee.email,
        `${user.name} ke liye emergency access request`,
        `Aapko emergency access link mila hai. Waiting period khatam hone ke baad link active hoga: ${process.env.APP_URL || 'http://localhost:5173'}/emergency/${token}`
      );
    }

    if (user.nominee.notifiedAt && emergencyAccessOpen(user.nominee.notifiedAt, user.nominee.waitDays || waitDays, new Date())) {
      user.nominee.token = user.nominee.token || crypto.randomBytes(24).toString('hex');
      await user.save();
    }
  }
}
