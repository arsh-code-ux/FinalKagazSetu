import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRouter from './routes/auth.js';
import personsRouter from './routes/persons.js';
import docsRouter from './routes/docs.js';
import insightsRouter from './routes/insights.js';
import nomineeRouter from './routes/nominee.js';
import meRouter from './routes/me.js';
import devRouter from './routes/dev.js';
import assistantRouter from './routes/assistant.js';
import { startJobs } from './jobs.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests. Please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/persons', personsRouter);
app.use('/api/docs', docsRouter);
app.use('/api', insightsRouter);
app.use('/api', nomineeRouter);
app.use('/api', assistantRouter);
app.use('/api/me', meRouter);
app.use('/api/dev', devRouter);

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'KaagazSetu' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Something went wrong while processing your request.',
  });
});

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaagazsetu';

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully.');
    startJobs();
    app.listen(PORT, () => {
      console.log(`KaagazSetu backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
