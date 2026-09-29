const state = { mode: 'login', authenticated: false };
const $ = (selector) => document.querySelector(selector);

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('jamstock_session');
  if (token) headers.set('Authorization', token);
  const response = await fetch(url, { ...options, headers, cache: 'no-store' });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`The local JamStock server returned an unexpected page for ${url} (HTTP ${response.status}). Restart it with Start.command, then use http://127.0.0.1:3000.`);
  }
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function showAuth(mode) {
  state.mode = mode;
  $('#auth-view').hidden = false;
  $('#dashboard-view').hidden = true;
  $('#auth-form').hidden = false;
  const setup = mode === 'setup';
  const reset = mode === 'reset';
  $('#security-fields').hidden = !(setup || reset);
  $('#reset-button').hidden = setup || reset;
  $('#password-label').textContent = setup || reset ? 'Create administrator password' : 'Administrator password';
  $('#auth-form button[type="submit"]').textContent = setup ? 'Create password' : reset ? 'Reset password' : 'Unlock workspace';
  $('#security-heading').textContent = setup ? 'Save these answers for password recovery. They are not used to log in.' : 'Answer all three questions to reset your password.';
  $('#password-input').value = '';
  $('#auth-copy').textContent = setup ? 'Create the local password used to protect this workspace.' : reset ? 'Answer your recovery questions to create a new local password.' : 'Unlock the local workspace to continue.';
  $('#auth-error').textContent = '';
  if (!setup && !reset) ['#question-one', '#question-two', '#question-three'].forEach((selector) => { $(selector).value = ''; });
}

function showDashboard(panelId = 'overview-panel') {
  state.authenticated = true;
  $('#auth-view').hidden = true;
  $('#dashboard-view').hidden = false;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.panel === panelId));
  document.querySelectorAll('.content-panel, .panel-grid').forEach((panel) => { panel.hidden = panel.id !== panelId; });
  loadDashboard();
}

async function loadDashboard() {
  const data = await request('/api/dashboard');
  $('#eligible-count').textContent = data.eligible;
  $('#checked-in-count').textContent = data.checkedIn;
  $('#band-count').textContent = data.bands;
  $('#issue-count').textContent = data.issues;
  renderParticipants(data.participants);
  renderBands(data.bandDetails);
}

function renderParticipants(participants) {
  const search = ($('#participant-search')?.value || '').toLowerCase();
  const rows = participants.filter((person) => `${person.first_name} ${person.last_name} ${person.email}`.toLowerCase().includes(search));
  $('#participant-list').innerHTML = rows.length ? rows.map((person) => `<div class="list-row"><div><strong>${escapeHtml(person.first_name)} ${escapeHtml(person.last_name)}</strong><small>${escapeHtml(person.email)}</small></div><div class="person-details"><strong>Primary: ${escapeHtml(person.instruments)}</strong><small>Secondary: ${escapeHtml(person.secondary_instruments)}</small></div><div class="person-details"><strong>${escapeHtml(shortExperience(person.experience))}</strong><small>Mentorship: ${escapeHtml(shortMentorship(person.mentorship))} · ${person.mentorship_score}/100</small></div><span class="status">${person.checked_in ? 'Checked in' : person.status}</span><button class="button button-quiet" data-checkin="${person.id}">${person.checked_in ? 'Undo' : 'Check in'}</button></div>`).join('') : '<p class="muted">No participants match this search.</p>';
  document.querySelectorAll('[data-checkin]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/participants/${button.dataset.checkin}/check-in`, { method: 'POST' }); loadDashboard(); }));
}

function renderBands(bands) {
  $('#band-list').innerHTML = bands.length ? bands.map((band) => `<article class="band-card"><p class="eyebrow">${band.locked ? 'LOCKED' : 'DRAFT'} · ${escapeHtml(band.name)}</p><h3>${band.members.length} performers</h3><ul>${band.members.map((member) => `<li><strong>${escapeHtml(member.first_name)} ${escapeHtml(member.last_name)}</strong><span>${escapeHtml(member.instruments)}${member.secondary_instruments !== 'None listed' ? ` · also ${escapeHtml(member.secondary_instruments)}` : ''}</span><small>${escapeHtml(shortExperience(member.experience))} · Mentorship ${member.mentorship_score}/100 (${escapeHtml(shortMentorship(member.mentorship))})</small></li>`).join('')}</ul><button class="button button-quiet" data-lock="${band.id}">${band.locked ? 'Unlock' : 'Save band'}</button></article>`).join('') : '<p class="muted">No bands generated yet.</p>';
  document.querySelectorAll('[data-lock]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/bands/${button.dataset.lock}/lock`, { method: 'POST' }); loadDashboard(); }));
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function shortExperience(value) { return String(value || 'Experience not listed').split(' - ')[0]; }
function shortMentorship(value) { if (!value) return 'Not listed'; if (value.includes('experience that I would love to share')) return 'Mentor'; if (value.includes('new and will humbly learn')) return 'Learner'; if (value.includes('not here to learn')) return 'Not participating'; return value; }

$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#auth-error').textContent = '';
  const endpoint = state.mode === 'setup' ? '/api/auth/setup' : state.mode === 'reset' ? '/api/auth/reset' : '/api/auth/login';
  const payload = { password: $('#password-input').value };
  if (state.mode === 'setup' || state.mode === 'reset') Object.assign(payload, { answers: [$('#question-one').value, $('#question-two').value, $('#question-three').value] });
  try {
    const result = await request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (state.mode === 'setup') {
      localStorage.removeItem('jamstock_session');
      showAuth('login');
      $('#auth-copy').textContent = 'Password created. Log in to begin importing your spreadsheet.';
      return;
    }
    localStorage.setItem('jamstock_session', result.token);
    showDashboard(state.mode === 'login' ? 'imports-panel' : 'overview-panel');
  } catch (error) { $('#auth-error').textContent = error.message; }
});

$('#logout-button').addEventListener('click', async () => { await request('/api/auth/logout', { method: 'POST' }); localStorage.removeItem('jamstock_session'); state.authenticated = false; showAuth('login'); });

$('#reset-button').addEventListener('click', () => showAuth('reset'));

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach((item) => item.classList.remove('is-active')); tab.classList.add('is-active'); document.querySelectorAll('.content-panel, .panel-grid').forEach((panel) => { panel.hidden = panel.id !== tab.dataset.panel; }); }));
$('#participant-search').addEventListener('input', () => request('/api/dashboard').then((data) => renderParticipants(data.participants)));
$('#check-in-all-button').addEventListener('click', async () => { try { const result = await request('/api/participants/check-in-all', { method: 'POST' }); $('#notice').hidden = false; $('#notice').textContent = `${result.count} eligible participants checked in.`; await loadDashboard(); } catch (error) { $('#notice').hidden = false; $('#notice').textContent = error.message; } });
$('#generate-button').addEventListener('click', async () => { if (!window.confirm('Generate bands from the currently checked-in participants?')) return; try { const result = await request('/api/bands/generate', { method: 'POST' }); $('#notice').hidden = false; $('#notice').textContent = result.message; await loadDashboard(); } catch (error) { $('#notice').hidden = false; $('#notice').textContent = error.message; } });
$('#clear-bands-button').addEventListener('click', async () => { if (!window.confirm('Clear all bands, including saved ones, so you can start matching from scratch?')) return; try { await request('/api/bands/clear', { method: 'POST' }); $('#notice').hidden = false; $('#notice').textContent = 'All bands cleared.'; await loadDashboard(); } catch (error) { $('#notice').hidden = false; $('#notice').textContent = error.message; } });
$('#export-bands-button').addEventListener('click', () => { const token = localStorage.getItem('jamstock_session'); window.open(`/api/bands/export?token=${encodeURIComponent(token || '')}`, '_blank'); });
$('#reset-all-button').addEventListener('click', async () => { if (!window.confirm('This deletes every imported participant and band so you can test from scratch. This cannot be undone. Continue?')) return; try { await request('/api/reset', { method: 'POST' }); $('#notice').hidden = false; $('#notice').textContent = 'Workspace reset. Import a spreadsheet to begin again.'; await loadDashboard(); } catch (error) { $('#notice').hidden = false; $('#notice').textContent = error.message; } });
$('#import-form').addEventListener('submit', async (event) => { event.preventDefault(); const formData = new FormData(); formData.append('file', $('#import-file').files[0]); try { const result = await request('/api/import/preview', { method: 'POST', body: formData }); $('#import-result').innerHTML = `<p class="status">${result.valid} eligible · ${result.excluded} excluded · ${result.invalid} needing review · ${result.duplicates} duplicate emails removed</p><button id="commit-import" class="button button-primary">Save eligible rows</button>`; $('#commit-import').addEventListener('click', async () => { const saved = await request('/api/import/commit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.rows) }); $('#notice').hidden = false; $('#notice').textContent = `${saved.inserted} rows saved; ${saved.duplicates} duplicate emails skipped.`; loadDashboard(); }); } catch (error) { $('#import-result').textContent = error.message; } });

request('/api/auth/status').then((data) => data.configured ? showAuth('login') : showAuth('setup')).catch((error) => { showAuth('setup'); $('#auth-error').textContent = error.message; });
