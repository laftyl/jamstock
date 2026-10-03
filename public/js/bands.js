export function renderBands(bands, request, loadDashboard) {
  const seedInput = document.querySelector('#generation-seed');
  if (seedInput.dataset.initialized !== 'true') {
    seedInput.value = bands.find((band) => !band.locked)?.seed ?? bands[0]?.seed ?? 'jamstock-v1';
    seedInput.dataset.initialized = 'true';
  }
  document.querySelector('#generate-button').textContent = bands.length ? 'Regenerate bands' : 'Generate bands';
  document.querySelector('#band-list').innerHTML = bands.length
    ? bands.map((band) => bandCard(band)).join('')
    : '<p class="muted">No bands generated yet.</p>';

  document.querySelectorAll('[data-lock]').forEach((button) => {
    button.addEventListener('click', async () => {
      await request(`/api/bands/${button.dataset.lock}/lock`, { method: 'POST' });
      loadDashboard();
    });
  });

  document.querySelectorAll('[data-band-rename]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = form.querySelector('input').value.trim();

      try {
        const result = await request(`/api/bands/${form.dataset.bandRename}/name`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        showNotice(`${result.name} saved and locked.`);
        await loadDashboard();
      } catch (error) {
        showNotice(error.message);
      }
    });
  });
}

export function bindBandEvents(request, loadDashboard) {
  document.querySelector('#generate-button').addEventListener('click', async () => {
    if (!window.confirm('Generate bands from the currently checked-in participants?')) {
      return;
    }

    try {
      const result = await request('/api/bands/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: document.querySelector('#generation-seed').value }),
      });
      showNotice(result.timedOut ? `${result.message} Matching reached the 10-second limit; this is the best result found so far.` : result.message);
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
  const producers = (band.producers || []).map((producer) =>
    `${producer.first_name} ${producer.last_name}`.trim()).join(', ');
  const flags = (band.flags || []).map((flag) =>
    `<li><strong>${escapeHtml(flag.severity)} · ${escapeHtml(flag.title)}</strong><span>${escapeHtml(flag.message)}</span></li>`).join('');

  return `<article class="band-card"><p class="eyebrow">${band.locked ? 'LOCKED' : 'DRAFT'}</p><form class="band-name-form" data-band-rename="${band.id}"><label class="sr-only" for="band-name-${band.id}">Band name</label><input id="band-name-${band.id}" class="search band-name-input" type="text" value="${escapeHtml(band.name)}" maxlength="80" required><button class="button button-quiet" type="submit">Rename &amp; lock</button></form><h3>${band.members.length} performers</h3><ul>${members}</ul><p class="muted">Producer: ${escapeHtml(producers || 'Needed')}</p>${flags ? `<ul>${flags}</ul>` : ''}<button class="button button-quiet" data-lock="${band.id}">${band.locked ? 'Unlock' : 'Save band'}</button></article>`;
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