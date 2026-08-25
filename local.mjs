import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 4173;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.json': 'application/json; charset=utf-8'
};

const MEDICINE = /\b(prescribe|prescribing|recommend.*medicine|what.*(medicine|drug)|what should i take|dosage|dose|how many (mg|tablets)|start taking|stop taking|change.*medicine|replace.*medicine)\b/i;
const EMERGENCY = /\b(chest pain|trouble breathing|shortness of breath|fainted|unconscious|seizure|stroke|severe bleeding|suicidal)\b/i;

const SYSTEM = `
You are GramVEDA Sahayak, a health-information assistant for rural telemedicine care points in India.

You are not a doctor and cannot diagnose or provide treatment.

You may:
- Explain general health concepts.
- Help patients prepare questions for a clinician.
- Explain medicine-label information, storage and adherence reminders.

Never:
- Recommend, prescribe, select, compare, start, stop, substitute or change medicines.
- Give medicine doses, schedules or treatment plans.

For medication decisions, direct the patient to their doctor or pharmacist.
For symptoms, encourage clinical assessment.
For emergency warning signs, advise immediate local medical care.

Be concise, calm and use plain English.
`;

function reply(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  let body = '';

  for await (const chunk of req) {
    body += chunk;
    if (body.length > 12000) throw new Error('Request too large');
  }

  return body;
}

function guardrail(message) {
  if (EMERGENCY.test(message)) {
    return 'This could be urgent. Please seek emergency medical care immediately or contact local emergency services. I cannot assess emergencies in chat.';
  }

  if (MEDICINE.test(message)) {
    return 'I can’t recommend, prescribe, or change medicines or doses. Please ask the consulting doctor or pharmacist. I can help you prepare questions to ask them.';
  }

  return null;
}

async function chat(req, res) {
  try {
    const { message, history = [] } = JSON.parse(await readBody(req));

    if (!message?.trim()) {
      return reply(res, 400, { error: 'Please enter a question.' });
    }

    const blocked = guardrail(message);
    if (blocked) {
      return reply(res, 200, { reply: blocked, guardrail: true });
    }

    if (!apiKey) {
      return reply(res, 503, {
        error: 'GEMINI_API_KEY is not configured.'
      });
    }

    const contents = [
      ...history.slice(-6).map(item => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(item.text || '').slice(0, 700) }]
      })),
      {
        role: 'user',
        parts: [{ text: message.slice(0, 500) }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM }]
          },
          contents,
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 240
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini request failed');
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join('')
      .trim();

    if (!text) throw new Error('No response was returned.');

    if (MEDICINE.test(text)) {
      return reply(res, 200, {
        reply:
          'I can explain general medicine information, but I can’t recommend or change medicines or doses. Please confirm this with the consulting doctor or pharmacist.',
        guardrail: true
      });
    }

    reply(res, 200, { reply: text });

  } catch (error) {
    reply(res, 500, {
      error: error.message || 'Sahayak is temporarily unavailable.'
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/sahayak') {
    return chat(req, res);
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    return reply(res, 405, { error: 'Method not allowed' });
  }

  const file = decodeURIComponent(
    url.pathname === '/' ? '/index.html' : url.pathname
  );

  const target = path.resolve(root, `.${file}`);

  if (!target.startsWith(root)) {
    return reply(res, 403, { error: 'Forbidden' });
  }

  try {
    const info = await stat(target);

    if (!info.isFile()) throw new Error();

    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target)] || 'application/octet-stream'
    });

    if (req.method === 'HEAD') return res.end();

    res.end(await readFile(target));

  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`GramVEDA running at http://localhost:${port}`);
});
