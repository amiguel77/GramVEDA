/*-- Home Sahayak State -- */
const homeBotHistory = [];

/*-- Safe Demo Reply -- */
const homeSafeReply = (message) => {
  if (
    /chest pain|trouble breathing|shortness of breath|fainted|unconscious|seizure|stroke|severe bleeding|suicidal/i.test(
      message
    )
  ) {
    return 'This may be urgent. Please seek emergency medical care immediately or contact local emergency services. I cannot assess emergencies in chat.';
  }

  if (
    /medicine should|what should i take|dosage|dose|how many (mg|tablets)|start taking|stop taking|change.*medicine|recommend.*medicine|prescrib/i.test(
      message
    )
  ) {
    return 'I can’t recommend, prescribe, or change medicines or doses. Please ask a doctor or pharmacist. I can help you prepare questions to ask them.';
  }

  if (/label|medicine|tablet|syrup|drug/i.test(message)) {
    return 'I can explain general medicine-label information, such as the medicine name, expiry date, storage instructions and pharmacist directions. Please follow the prescription label and confirm medicine-specific questions with a pharmacist.';
  }

  return 'For a useful doctor consultation, share when the concern started, what makes it better or worse, relevant allergies, existing conditions and medicines already being used. A clinician should assess symptoms before treatment decisions.';
};

/*-- Home Chat Bubble -- */
const addHomeBubble = (text, role) => {
  const thread = document.querySelector('#home-chat-thread');
  const bubble = document.createElement('div');

  bubble.className = `home-chat-bubble ${role}`;
  bubble.textContent = text;

  thread.append(bubble);
  thread.scrollTop = thread.scrollHeight;
};

/*-- Open Home Sahayak -- */
document
  .querySelector('#home-bot-button')
  ?.addEventListener('click', () => {
    document.querySelector('#home-bot').classList.add('show');
  });

/*-- Close Home Sahayak -- */
document
  .querySelector('.home-bot-close')
  ?.addEventListener('click', () => {
    document.querySelector('#home-bot').classList.remove('show');
  });

/*-- Home Chat Form -- */
document
  .querySelector('#home-chat-form')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.querySelector('#home-chat-input');
    const message = input.value.trim();

    if (!message) return;

    addHomeBubble(message, 'user');

    homeBotHistory.push({
      role: 'user',
      text: message
    });

    input.value = '';

    const pending = document.createElement('div');

    pending.className = 'home-chat-bubble bot pending';
    pending.textContent = 'Sahayak is thinking…';

    document
      .querySelector('#home-chat-thread')
      .append(pending);

    try {
      const response = await fetch('/api/sahayak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history: homeBotHistory.slice(0, -1)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Unavailable');
      }

      pending.remove();

      addHomeBubble(data.reply, 'bot');

      homeBotHistory.push({
        role: 'model',
        text: data.reply
      });
    } catch {
      const reply = homeSafeReply(message);

      pending.remove();

      addHomeBubble(reply, 'bot');

      homeBotHistory.push({
        role: 'model',
        text: reply
      });
    }
  });