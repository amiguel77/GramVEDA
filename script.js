// Toast notification
const toast = document.querySelector('#toast');

const showToast = (message) => {
  if (!toast) return;

  toast.firstChild.textContent = message + ' ';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
};


// Tab titles
const tabTitles = {
  vitals: 'Patient vitals',
  consult: 'Doctor consult',
  medicine: 'Medicine network'
};


// Workspace tabs
document.querySelectorAll('.side-link').forEach((button) => {
  button.addEventListener('click', () => {
    document
      .querySelectorAll('.side-link, .tab-content')
      .forEach((item) => item.classList.remove('active'));

    button.classList.add('active');

    document
      .querySelector('#' + button.dataset.tab)
      .classList.add('active');

    const title = document.querySelector('#tab-title');

    if (title) {
      title.textContent = tabTitles[button.dataset.tab];
    }
  });
});


// Save vitals
document.querySelector('.save-vitals')?.addEventListener('click', () => {
  showToast('Vitals saved. Doctor request sent to the care queue.');

  document
    .querySelector('[data-tab="consult"]')
    ?.click();
});


// Start doctor consultation
document
  .querySelector('.connect-doctor')
  ?.addEventListener('click', () => {
    showToast('Secure video room created. Dr. Arjun will join shortly.');
  });


// Request medicine from node
document
  .querySelector('.request-node')
  ?.addEventListener('click', () => {
    showToast(
      'Request sent to Asha Medical Node. Estimated arrival: 5:30 PM.'
    );
  });


// Close toast
document
  .querySelector('.toast button')
  ?.addEventListener('click', () => {
    toast.classList.remove('show');
  });