supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) window.location.href = '/login.html';
});