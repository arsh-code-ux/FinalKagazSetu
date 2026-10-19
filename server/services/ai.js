const apiKey = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile';

async function callGroq(prompt, mimeType, buffer) {
  if (!apiKey) return null;

  const base64 = buffer.toString('base64');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

const documentTypes = ['aadhaar', 'pan', 'insurance', 'fd', 'rc', 'certificate', 'property', 'other'];

export function maskAadhaarNumber(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '').slice(-4);
  if (!digits) return null;
  return `XXXX XXXX ${digits.padStart(4, '0')}`;
}

export function normalizeExtracted(raw = {}) {
  const out = { ...raw };
  if (typeof out.type === 'string' && !documentTypes.includes(out.type.toLowerCase())) {
    out.type = 'other';
  }
  if (out.type === 'aadhaar' && out.number) {
    out.number = maskAadhaarNumber(out.number);
  }
  if (out.expiryDate && typeof out.expiryDate === 'string') {
    const date = new Date(out.expiryDate);
    out.expiryDate = Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  if (out.issueDate && typeof out.issueDate === 'string') {
    const date = new Date(out.issueDate);
    out.issueDate = Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  if (typeof out.amount === 'string' && out.amount.trim()) {
    const n = Number(out.amount.replace(/[^0-9.-]/g, ''));
    out.amount = Number.isFinite(n) ? n : null;
  }
  if (typeof out.confidence === 'string') {
    const c = Number(out.confidence);
    out.confidence = Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 0.5;
  }
  return out;
}

export async function extractDoc(buffer, mimeType) {
  const fallback = {
    type: 'other',
    holderName: null,
    number: null,
    issuer: null,
    issueDate: null,
    expiryDate: null,
    nominee: null,
    amount: null,
    confidence: 0.45,
  };

  if (!apiKey) {
    return fallback;
  }

  const prompt = `You are extracting data from an Indian personal document. Return ONLY valid JSON with this exact shape:
{
  "type": "aadhaar|pan|insurance|fd|rc|certificate|property|other",
  "holderName": "string or null",
  "number": "string or null",
  "issuer": "string or null",
  "issueDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "nominee": "string or null",
  "amount": number or null,
  "confidence": 0.0 to 1.0
}
Rules:
- Never guess. Use null when unclear.
- For Aadhaar, store only last 4 digits in format XXXX XXXX 1234.
- For numbers, do not include full Aadhaar numbers.
- Keep the output valid JSON only, no markdown, no narrative.`;

  try {
    const payload = await callGroq(prompt, mimeType, buffer);
    const cleaned = String(payload || '')
      .replace(/```json|```/g, '')
      .trim();

    if (!cleaned) {
      return fallback;
    }

    const parsed = JSON.parse(cleaned);
    return normalizeExtracted(parsed);
  } catch (error) {
    console.error('AI extraction failed:', error.message);
    return fallback;
  }
}
