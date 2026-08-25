async function loadHistory() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: visits, error } = await sb
    .from('consultations')
    .select('*')
    .eq('patient_id', session.user.id)
    .order('visit_date', { ascending: false });

  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('emptyState');

  if (error) {
    listEl.innerHTML = `<p class="form-error">Could not load history.</p>`;
    return;
  }

  if (!visits || visits.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  listEl.innerHTML = visits.map((v) => `
    <div style="background:#f1fbff;border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:14px;">${v.doctor_name || 'General checkup'}</strong>
        <small style="color:var(--muted);">${new Date(v.visit_date).toLocaleDateString()}</small>
      </div>
      <p style="font-size:12px;color:var(--muted);margin:8px 0 0;">
        BP: ${v.blood_pressure || '—'} · Sugar: ${v.blood_sugar || '—'} ·
        Temp: ${v.temperature || '—'} · Pulse: ${v.pulse || '—'}
      </p>
      ${v.note ? `<p style="font-size:13px;color:var(--ink);margin-top:8px;">${v.note}</p>` : ''}
    </div>
  `).join('');
}

loadHistory();
