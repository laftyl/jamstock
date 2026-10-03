export function renderBands(bands, request, loadDashboard) {
  document.querySelector('#band-list').innerHTML = bands.length
    ? bands.map((band) => bandCard(band)).join('')
    : '<p class="muted">No bands generated yet.</p>';

  document.querySelectorAll('[data-lock]').forEach((button) => {
    button.addEventListener('click', async () => {
      await request(`/api/bands/${button.dataset.lock}/lock`, { method: 'POST' });
      loadDashboard();
    });
  });
}

export function bindBandEvents(request, loadDashboard) {
  document.querySelector('#generate-button').addEventListener('click', async () => {
    if (!window.confirm('Generate bands from the currently checked-in participants?')) {
      return;
    }

    try {
      const result = await request('/api/bands/generate', { method: 'POST' });
      showNotice(result.message);
      await loadDashboard();
    } catch (error) {
      showNotice(error.message);
    }
  });

  document.querySelector('#clear-bands-button').addEventListener('click', async () => {
    if (!window.confirm('Clear all bands, including saved ones, so you can start matching from scratch?')) {
      return;
    }

    try {
      await request('/api/bands/clear', { method: 'POST' });
      showNotice('All bands cleared.');
      await loadDashboard();
    } catch (error) {
      showNotice(error.message);
    }
  });

  document.querySelector('#export-bands-button').addEventListener('click', () => {
    const token = localStorage.getItem('jamstock_session');
    window.open(`/api/bands/export?token=${encodeURIComponent(token || '')}`, '_blank');
  });
}

function bandCard(band) {
  const members = band.members.map((member) => {
    const instruments = Array.isArray(member.primary_instruments) ? member.primary_instruments : [];
    const instrumentText = instruments.length ? instruments.join(', ') : 'Needs review';
    return `<li><strong>${escapeHtml(member.first_name)} ${escapeHtml(member.last_name)}</strong><span>${escapeHtml(instrumentText)}</span><small>${escapeHtml(shortExperience(member.experience))} · Mentorship ${member.mentorship_score}/100 (${escapeHtml(shortMentorship(member.mentorship))})</small></li>`;
  }).join('');

  return `<article class="band-card"><p class="eyebrow">${band.locked ? 'LOCKED' : 'DRAFT'} · ${escapeHtml(band.name)}</p><h3>${band.members.length} performers</h3><ul>${members}</ul><button class="button button-quiet" data-lock="${band.id}">${band.locked ? 'Unlock' : 'Save band'}</button></article>`;
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