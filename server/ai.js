const apiKey = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile';

async function callGroq(prompt, mime, buffer) {
  if (!apiKey) return null;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}` } },
        ],
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

const PROMPT = `Ye ek Indian personal document hai. Sirf JSON return karo (koi extra text/backticks nahi):
{
 "type": "aadhaar|pan|insurance|fd|rc|certificate|property|other",
 "holderName": string|null,
 "number": string|null,   // Aadhaar ho to SIRF last 4 digits, "XXXX XXXX 1234" format me
 "issuer": string|null,   // bank/insurer/authority
 "issueDate": "YYYY-MM-DD"|null,
 "expiryDate": "YYYY-MM-DD"|null, // insurance renewal/maturity/validity date
 "nominee": string|null,
 "amount": number|null,
 "confidence": 0-1
}
Jo field document me clearly na dikhe use null rakho. Andaza mat lagao.`;

export async function extractDoc(buffer, mime) {
  if (!apiKey) return null;

  const text = await callGroq(PROMPT, mime, buffer);
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const data = JSON.parse(cleaned);

  if (data.type === 'aadhaar' && data.number) {
    const last4 = data.number.replace(/\D/g, '').slice(-4);
    data.number = `XXXX XXXX ${last4}`;
  }

  return data;
}
