export function renderParticipants(participants, request, loadDashboard) {
  const search = (document.querySelector('#participant-search')?.value || '').toLowerCase();
  const rows = participants.filter((person) =>
    `${person.first_name} ${person.last_name} ${person.email}`.toLowerCase().includes(search));

  document.querySelector('#participant-list').innerHTML = rows.length
    ? rows.map((person) => participantRow(person)).join('')
    : '<p class="muted">No participants match this search.</p>';

  document.querySelectorAll('[data-checkin]').forEach((button) => {
    button.addEventListener('click', async () => {
      await request(`/api/participants/${button.dataset.checkin}/check-in`, { method: 'POST' });
      loadDashboard();
    });
  });
}

export function bindParticipantEvents(request, render) {
  document.querySelector('#participant-search').addEventListener('input', async () => {
    const data = await request('/api/dashboard');
    render(data.participants);
  });

  document.querySelector('#check-in-all-button').addEventListener('click', async () => {
    try {
      const result = await request('/api/participants/check-in-all', { method: 'POST' });
      showNotice(`${result.count} eligible participants checked in.`);
      await render();
    } catch (error) {
      showNotice(error.message);
    }
  });
}

function participantRow(person) {
  const instruments = Array.isArray(person.primary_instruments) ? person.primary_instruments : [];
  const instrumentLabel = instruments.length === 1 ? 'Primary instrument' : 'Primary instruments';
  const instrumentText = instruments.length ? instruments.join(', ') : 'Needs review';

  return `<div class="list-row"><div><strong>${escapeHtml(person.first_name)} ${escapeHtml(person.last_name)}</strong><small>${escapeHtml(person.email)}</small></div><div class="person-details"><strong>${instrumentLabel}: ${escapeHtml(instrumentText)}</strong><small>Secondary: ${escapeHtml(person.secondary_instruments)}</small></div><div class="person-details"><strong>${escapeHtml(shortExperience(person.experience))}</strong><small>Mentorship: ${escapeHtml(shortMentorship(person.mentorship))} · ${person.mentorship_score}/100</small></div><span class="status">${person.checked_in ? 'Checked in' : escapeHtml(person.status)}</span><button class="button button-quiet" data-checkin="${person.id}">${person.checked_in ? 'Undo' : 'Check in'}</button></div>`;
}

function showNotice(message) {
  const notice = document.querySelector('#notice');
  notice.hidden = false;
  notice.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character]));
}

function shortExperience(value) {
  return String(value || 'Experience not listed').split(' - ')[0];
}

function shortMentorship(value) {
  if (!value) {
    return 'Not listed';
  }
  if (value.toLowerCase().includes('experience to share') || value.toLowerCase().includes('experience that i would love to share')) {
    return 'Mentor';
  }
  if (value.includes('new and will humbly learn')) {
    return 'Learner';
  }
  if (value.includes('not here to learn')) {
    return 'Not participating';
  }
  return value;
}