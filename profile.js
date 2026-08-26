let currentUserId = null;
let currentProfile = null;

async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = session.user.id;

  const { data: profile, error } = await sb
    .from('profiles')
    .select('name, phone, role')
    .eq('id', currentUserId)
    .single();

  if (error) {
    document.getElementById('viewName').textContent = 'Could not load profile.';
    return;
  }

  currentProfile = profile;
  renderView(session.user.email);
}

function renderView(email) {
  document.getElementById('viewName').textContent = currentProfile.name || '—';
  document.getElementById('viewPhone').textContent = currentProfile.phone || '—';
  document.getElementById('viewRole').textContent = currentProfile.role || '—';
  document.getElementById('viewEmail').textContent = email;

  // keep edit form in sync so it opens pre-filled
  document.getElementById('name').value = currentProfile.name || '';
  document.getElementById('phone').value = currentProfile.phone || '';
  document.getElementById('role').value = currentProfile.role || '';
  document.getElementById('email').value = email;
}

document.getElementById('editBtn').addEventListener('click', () => {
  document.getElementById('viewMode').style.display = 'none';
  document.getElementById('profileForm').style.display = 'block';
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('profileForm').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('formError').textContent = '';
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('formError');
  errorEl.textContent = '';

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  const { error } = await sb
    .from('profiles')
    .update({ name, phone })
    .eq('id', currentUserId);

  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  currentProfile.name = name;
  currentProfile.phone = phone;

  const { data: { session } } = await sb.auth.getSession();
  renderView(session.user.email);

  document.getElementById('profileForm').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  window.location.href = 'index.html';
});

loadProfile();
