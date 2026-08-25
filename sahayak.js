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

function guardrail(message) {
  if (EMERGENCY.test(message)) {
    return 'This could be urgent. Please seek emergency medical care immediately or contact local emergency services. I cannot assess emergencies in chat.';
  }
  if (MEDICINE.test(message)) {
    return 'I can’t recommend, prescribe, or change medicines or doses. Please ask the consulting doctor or pharmacist. I can help you prepare questions to ask them.';
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Please enter a question.' });
    }

    const blocked = guardrail(message);
    if (blocked) {
      return res.status(200).json({ reply: blocked, guardrail: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const contents = [
      ...history.slice(-6).map(item => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(item.text || '').slice(0, 700) }]
      })),
      { role: 'user', parts: [{ text: message.slice(0, 500) }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.25, maxOutputTokens: 240 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini request failed');
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();

    if (!text) throw new Error('No response was returned.');

    if (MEDICINE.test(text)) {
      return res.status(200).json({
        reply: 'I can explain general medicine information, but I can’t recommend or change medicines or doses. Please confirm this with the consulting doctor or pharmacist.',
        guardrail: true
      });
    }

    res.status(200).json({ reply: text });

  } catch (error) {
    res.status(500).json({ error: error.message || 'Sahayak is temporarily unavailable.' });
  }
}
