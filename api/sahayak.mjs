const MEDICINE_ACTION =
  /\b(prescrib(e|ing)|recommend( a|ing)? medicine|what (medicine|drug) should|what should i take|dosage|dose|how many (mg|tablets)|start taking|stop taking|change (my|the) medicine|replace (my|the) medicine)\b/i;

const EMERGENCY =
  /\b(chest pain|trouble breathing|shortness of breath|fainted|unconscious|seizure|stroke|severe bleeding|suicidal)\b/i;

const SYSTEM = `You are GramVEDA Sahayak, a careful health-information assistant for rural telemedicine care points in India. You are NOT a doctor and cannot diagnose or give medical treatment. You may explain general health concepts, help a patient prepare questions for a clinician, and explain general medicine-label information such as what common label fields mean, storage, adherence reminders, and why an official prescription label must be followed. Never recommend, prescribe, select, compare, start, stop, substitute, or change a medicine. Never give a dose, schedule, or treatment plan. If asked for any of these, say you cannot advise on medication decisions and direct the person to the consulting doctor or pharmacist. For symptoms, encourage a clinician assessment; for emergency warning signs, say to seek urgent local medical care immediately. Be concise, calm, respectful, and use plain English.`;

const safeReply = (message) => {
  if (EMERGENCY.test(message)) {
    return 'This could be urgent. Please seek emergency medical care immediately or contact local emergency services. I cannot assess emergencies in chat.';
  }

  if (MEDICINE_ACTION.test(message)) {
    return 'I can’t recommend, prescribe, or change medicines or doses. Please ask the consulting doctor or pharmacist, who can consider the patient’s condition and prescription. I can help you prepare questions to ask them.';
  }

  return null;
};

const json = (res, status, data) => {
  res.status(status).json(data);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return json(res, 405, {
      error: 'Method not allowed'
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      message,
      history = []
    } = body;

    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return json(res, 400, {
        error: 'Please enter a question.'
      });
    }

    const blocked = safeReply(message);

    if (blocked) {
      return json(res, 200, {
        reply: blocked,
        guardrail: true
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model =
      process.env.GEMINI_MODEL ||
      'gemini-3.7-flash';

    if (!apiKey) {
      return json(res, 503, {
        error:
          'Sahayak is not configured. Add GEMINI_API_KEY to the Vercel environment variables.'
      });
    }

    const contents = [
      ...history
        .slice(-6)
        .filter(
          (item) =>
            item &&
            typeof item.text === 'string'
        )
        .map((item) => ({
          role:
            item.role === 'model'
              ? 'model'
              : 'user',
          parts: [
            {
              text: item.text.slice(0, 700)
            }
          ]
        })),

      {
        role: 'user',
        parts: [
          {
            text: message.slice(0, 500)
          }
        ]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
          'x-goog-api-key': apiKey
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: SYSTEM
              }
            ]
          },

          contents,

          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 240
          }
        })
      }
    );

    const payload =
      await response.json();

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          'Gemini request failed'
      );
    }

    const reply =
      payload?.candidates?.[0]?.content?.parts
        ?.map(
          (part) => part.text || ''
        )
        .join('')
        .trim();

    if (!reply) {
      throw new Error(
        'No response was returned.'
      );
    }

    if (MEDICINE_ACTION.test(reply)) {
      return json(res, 200, {
        reply:
          'I can explain general medicine information, but I can’t recommend or change medicines or doses. Please confirm this with the consulting doctor or pharmacist.',
        guardrail: true
      });
    }

    return json(res, 200, {
      reply
    });

  } catch (error) {
    return json(res, 500, {
      error:
        error?.message ||
        'Sahayak is temporarily unavailable.'
    });
  }
}
