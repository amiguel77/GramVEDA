(async () => {
  const { data: { session } } = await sb.auth.getSession();
  const navLinks = document.querySelector('.nav nav');
  if (!navLinks) return;

  if (session) {
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    const registerLink = navLinks.querySelector('a[href="register.html"]');
    if (loginLink) loginLink.remove();
    if (registerLink) registerLink.remove();

    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.textContent = 'My Profile';
    navLinks.appendChild(profileLink);
  }
})();
