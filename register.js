document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('formError');
  errorEl.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name, role } // saved to auth.users.user_metadata
    }
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Register';

  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  // If email confirmation is ON in your Supabase Auth settings,
  // data.session will be null here — user must confirm via email first.
  if (!data.session) {
    alert('Account created. Check your email to confirm before logging in.');
    window.location.href = 'login.html';
    return;
  }

  // If email confirmation is OFF, they're already logged in — send them straight in.
  window.location.href = 'index.html';
});
