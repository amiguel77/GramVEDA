/*-- DOM Helpers -- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/*-- Toast Notifications -- */
const toast = (text) => {
  const t = $('#toast');

  if (!t) return;

  t.firstChild.textContent = text + ' ';
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 3500);
};

$('#toast button')?.addEventListener('click', () => {
  $('#toast').classList.remove('show');
});

/*-- Local Demo State -- */
const state = JSON.parse(localStorage.getItem('gramveda-demo') || '{}');

const save = (next) => {
  Object.assign(state, next);
  localStorage.setItem('gramveda-demo', JSON.stringify(state));
};

/*-- Patient Flow Navigation -- */
const showFlow = (id) => {
  $$('.flow-view, .flow-nav').forEach((x) => x.classList.remove('active'));

  $('#' + id)?.classList.add('active');
  $(`.flow-nav[data-view="${id}"]`)?.classList.add('active');

  const order = ['intake', 'vitals', 'request', 'medicine'];
  const i = order.indexOf(id);

  $$('.progress span').forEach((x, n) => {
    x.classList.toggle('done', n <= i);
  });
};

$$('.flow-nav').forEach((x) => {
  x.addEventListener('click', () => showFlow(x.dataset.view));
});

/*-- Patient Intake -- */
$('#intake-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  save({
    name: $('#patient-name').value,
    age: $('#patient-age').value,
    village: $('#patient-village').value,
    language: $('#language').value,
    reason: $('#reason').value
  });

  toast('Care session created for ' + state.name + '.');
  showFlow('vitals');
});

/*-- Vital Signs -- */
$('#save-vitals')?.addEventListener('click', () => {
  save({
    bp: $('#bp').value,
    sugar: $('#sugar').value,
    temp: $('#temp').value,
    pulse: $('#pulse').value,
    note: $('#pharma-note').value
  });

  toast('Vitals saved. Connecting to the matched doctor.');
  showFlow('request');

  setTimeout(startDoctorConnection, 450);
});

/*-- Back Navigation -- */
$$('.back').forEach((b) => {
  b.addEventListener('click', () => {
    const order = ['intake', 'vitals', 'request', 'medicine'];
    const current = $('.flow-view.active').id;
    const index = order.indexOf(current);

    showFlow(order[Math.max(0, index - 1)]);
  });
});

/*-- Doctor Connection State -- */
let connectionStarted = false;
let consultSeconds = 0;
let consultInterval;

const captions = [
  [0, 'Doctor has joined the consultation.'],
  [
    4,
    'Hello Ramesh ji, I have reviewed your vital signs and pharmacist notes.'
  ],
  [
    9,
    'Please tell me when the dizziness started and whether you have had enough water today.'
  ],
  [
    15,
    'Your blood pressure is mildly elevated. We will focus on hydration and symptom relief.'
  ],
  [
    22,
    'The pharmacist will arrange the prescribed medicines and explain how to take them.'
  ],
  [
    30,
    'Please return if symptoms worsen, or if there is fainting, chest pain or shortness of breath.'
  ]
];

/*-- Consultation Captions -- */
function updateCaption(seconds) {
  const item =
    [...captions].reverse().find(([time]) => seconds >= time) || captions[0];

  if ($('#caption-text')) {
    $('#caption-text').textContent = item[1];
  }
}

/*-- Consultation Timer -- */
function startClock() {
  clearInterval(consultInterval);
  consultSeconds = 0;

  consultInterval = setInterval(() => {
    consultSeconds++;

    const minutes = String(Math.floor(consultSeconds / 60)).padStart(2, '0');
    const seconds = String(consultSeconds % 60).padStart(2, '0');

    if ($('#consult-timer')) {
      $('#consult-timer').textContent = `${minutes}:${seconds}`;
    }

    updateCaption(consultSeconds);
  }, 1000);
}

/*-- Doctor Connection -- */
function startDoctorConnection() {
  if (connectionStarted || !$('#connection-stage')) return;

  connectionStarted = true;

  const stage = $('#connection-stage');
  const track = $('#request-track');

  stage.classList.add('connecting');
  track.classList.add('sending');

  $('#connection-title').textContent = 'Sending secure care request';
  $('#connection-status').textContent = 'Dr. Arjun is being notified now';

  setTimeout(() => {
    track.classList.add('accepted');
    stage.classList.add('connected');

    $('#connection-title').textContent = 'Dr. Arjun accepted your request';
    $('#connection-status').textContent =
      'Opening secure video consultation';

    toast('Doctor accepted. Starting the demo consultation.');

    setTimeout(() => {
      const consult = $('#video-consult');

      consult.classList.add('show');

      $('#connection-copy').textContent =
        'Your secure consultation is live. Auto-captions are generated for this demo.';

      const video = $('#doctor-video');

      video.play().catch(() => {});
      startClock();
    }, 950);
  }, 1700);
}

/*-- Doctor Video Events -- */
$('#doctor-video')?.addEventListener('timeupdate', (event) => {
  const video = event.currentTarget;
  updateCaption(Math.floor(video.currentTime));
});

$('#doctor-video')?.addEventListener('ended', () => {
  $('#caption-text').textContent =
    'Demo consultation ended. You can now complete the handoff to the pharmacy.';

  clearInterval(consultInterval);
});

/*-- Caption Controls -- */
$('#caption-toggle')?.addEventListener('click', (event) => {
  const box = $('#caption-box');

  box.classList.toggle('off');

  event.currentTarget.textContent = box.classList.contains('off')
    ? 'CC Captions off'
    : 'CC Captions on';
});

/*-- Complete Patient Demo -- */
$('#complete-demo')?.addEventListener('click', () => {
  clearInterval(consultInterval);
  $('#doctor-video')?.pause();

  save({
    consultComplete: true,
    prescription: 'Betahistine 8 mg · ORS sachets'
  });

  toast('Demo consultation completed. Prescription is ready for fulfilment.');
  showFlow('medicine');
});

/*-- Medicine Node Request -- */
$('.node-request')?.addEventListener('click', () => {
  $('#node-confirm').classList.add('show');
  toast('Medicine request sent to Asha Medical Node.');
});

/*-- Sahayak Panel -- */
$('#open-sahayak')?.addEventListener('click', () => {
  $('#sahayak').classList.add('show');
});

$('.panel-close')?.addEventListener('click', () => {
  $('#sahayak').classList.remove('show');
});

/*-- Sahayak Tips -- */
let tip = 0;

const tips = [
  'Start with a calm introduction, check consent, then record vitals before requesting a doctor.',
  'If dizziness is reported, record when it started and ask if there was any fainting or fall.',
  'Repeat the doctor’s instructions back to the patient before completing the visit.'
];

$('#sahayak-next')?.addEventListener('click', () => {
  tip = (tip + 1) % tips.length;
  $('.sahayak-message p').textContent = tips[tip];
});

/*-- Sahayak Chat State -- */
const sahayakHistory = [];

/*-- Chat Messages -- */
const addChatMessage = (text, role) => {
  const thread = $('#chat-thread');

  if (!thread) return;

  const bubble = document.createElement('div');

  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;

  thread.append(bubble);
  thread.scrollTop = thread.scrollHeight;
};

/*-- Safe Demo Fallback -- */
const safeDemoReply = (message) => {
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
    return 'I can’t recommend, prescribe, or change medicines or doses. Please ask the consulting doctor or pharmacist. I can help you prepare questions to ask them.';
  }

  if (/label|medicine|tablet|syrup|drug/i.test(message)) {
    return 'I can explain what common medicine-label fields mean, such as the medicine name, expiry date, storage instructions and pharmacist directions. Please follow the prescription label and confirm any medicine-specific question with a pharmacist.';
  }

  return 'For a useful doctor consultation, share when the concern started, what makes it better or worse, any existing conditions, allergies, and medicines already being used. A clinician should assess symptoms before treatment decisions.';
};

/*-- Sahayak Chat Request -- */
async function askSahayak(message) {
  const input = $('#chat-input');

  if (!message) return;

  addChatMessage(message, 'user');

  sahayakHistory.push({
    role: 'user',
    text: message
  });

  if (input) {
    input.value = '';
  }

  const pending = document.createElement('div');

  pending.className = 'chat-bubble bot pending';
  pending.textContent = 'Sahayak is thinking…';

  $('#chat-thread').append(pending);

  try {
    const response = await fetch('/api/sahayak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history: sahayakHistory.slice(0, -1)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Sahayak is unavailable.');
    }

    pending.remove();

    addChatMessage(data.reply, 'bot');

    sahayakHistory.push({
      role: 'model',
      text: data.reply
    });
  } catch {
    const reply = safeDemoReply(message);

    pending.remove();

    addChatMessage(reply, 'bot');

    sahayakHistory.push({
      role: 'model',
      text: reply
    });
  }
}

/*-- Chat Form -- */
$('#chat-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  askSahayak($('#chat-input').value.trim());
});

$$('.chat-suggestions button').forEach((button) => {
  button.addEventListener('click', () => {
    askSahayak(button.textContent);
  });
});

/*-- Clinician Portal Navigation -- */
const showPortal = (id) => {
  $$('.portal-view, .portal-link').forEach((x) => {
    x.classList.remove('active');
  });

  $('#' + id)?.classList.add('active');
  $(`.portal-link[data-portal="${id}"]`)?.classList.add('active');
};

$$('.portal-link').forEach((x) => {
  x.addEventListener('click', () => showPortal(x.dataset.portal));
});

/*-- Incoming Consultation Request -- */
$('#accept')?.addEventListener('click', () => {
  $('#incoming').classList.add('accepted');
  $('#consult-room').classList.add('show');
  $('#queue-count').textContent = '0';

  toast('Video room opened. Patient and pharmacist have joined.');
});

$('#decline')?.addEventListener('click', () => {
  $('#incoming').classList.add('accepted');
  $('#queue-count').textContent = '0';

  toast('Request returned to the matching queue.');
});

/*-- Complete Clinician Consultation -- */
$('#complete-consult')?.addEventListener('click', () => {
  save({
    prescription: $('#prescription').value,
    doctorNotes: $('#doctor-notes').value,
    consultComplete: true
  });

  toast('Prescription sent to Sunrise Medical Store.');

  $('#consult-room').classList.remove('show');
  $('#incoming').classList.add('accepted');
});