let currentUserId = null;

async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = session.user.id;
  document.getElementById('email').value = session.user.email;

  const { data: profile, error } = await sb
    .from('profiles')
    .select('name, phone, role')
    .eq('id', currentUserId)
    .single();

  if (error) {
    document.getElementById('formError').textContent = 'Could not load profile.';
    return;
  }

  document.getElementById('name').value = profile.name || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('role').value = profile.role || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('formError');
  const successEl = document.getElementById('formSuccess');
  errorEl.textContent = '';
  successEl.textContent = '';

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

  successEl.textContent = 'Profile updated.';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  window.location.href = 'index.html';
});

loadProfile();
