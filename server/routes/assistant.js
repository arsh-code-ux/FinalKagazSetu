import express from 'express';

import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async.js';

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile';

function localAssistantReply(question = '') {
  const normalized = String(question || '').trim().toLowerCase();

  if (!normalized) {
    return 'Please ask a question and I will help you with a practical answer and next step.';
  }

  if (/^(hi|hello|hey|namaste|good morning|good evening|good night)/.test(normalized)) {
    return 'Hello! I’m here to help with your planning, decisions, and day-to-day tasks. Ask me anything clearly and I’ll help you think it through.';
  }

  if (/how are you|how\s+you\s+doing|are you okay/.test(normalized)) {
    return 'I’m doing well. I can help you organise your tasks, plan better, and find the simplest next step for what you need.';
  }

  if (/(budget|money|finance|expense|spend|save|invest|cash)/.test(normalized)) {
    return 'To manage your budget better, start with fixed expenses, keep a savings rule, and separate essential spending from flexible spending. Review your budget weekly and keep a small emergency buffer.';
  }

  if (/(study|learn|exam|course|school|college|knowledge)/.test(normalized)) {
    return 'For study or learning, break the topic into small goals, set a daily target, and revise the most important ideas regularly. Consistency matters more than long study sessions.';
  }

  if (/(work|job|office|productivity|task|project|time)/.test(normalized)) {
    return 'For work, begin with the most important task, avoid switching too often, and keep one clear outcome for each session. Daily review helps you stay focused and reduce overload.';
  }

  if (/(health|fitness|diet|sleep|wellbeing)/.test(normalized)) {
    return 'Good health habits are simple: sleep well, eat regularly, move daily, and keep stress under control. Small daily actions beat a perfect plan.';
  }

  if (/(relationship|family|personal|decision|goal|future|life)/.test(normalized)) {
    return 'For personal or life decisions, define the goal first, list the options, and choose the option with the most clarity and lowest risk. Keep the decision simple and practical.';
  }

  return `I can help with that. Give me the goal, the problem, or the decision you are trying to make, and I will suggest a practical step-by-step plan.`;
}

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const question = String(req.body?.question || '').trim();

  if (!question) {
    return res.status(400).json({ error: 'Please enter a question first.' });
  }

  if (!GROQ_API_KEY) {
    return res.json({ answer: localAssistantReply(question) });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a family records and document management app. Answer in a practical, concise and reassuring way. Give general guidance on documents, family records, legal rights, nominee planning, renewals, and secure storage. Do not claim to have access to private files unless the user has shared them. Keep answers clear and action-focused.',
          },
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Groq assistant failed:', response.status, errorBody);
      return res.json({ answer: localAssistantReply(question) });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    return res.json({ answer: answer || localAssistantReply(question) });
  } catch (error) {
    console.error('Assistant generation error:', error.message);
    return res.json({ answer: localAssistantReply(question) });
  }
}));

export default router;
