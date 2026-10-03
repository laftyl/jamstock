let selectedProducerId = null;

export function renderProducers(directory, request, loadDashboard) {
  const producerContent = document.querySelector('#producer-content');
  const producerShortage = document.querySelector('#producer-shortage');
  const producers = directory.producers || [];
  const producerOnly = producers.filter((producer) => producer.role === 'Producer only');
  const performerProducers = producers.filter((producer) => producer.role === 'Performer + Producer');
  const needsReview = directory.needsReview || [];
  const unassignedBands = (directory.bands || []).filter((band) => !band.producer);

  if (!producers.some((producer) => producer.id === selectedProducerId)) {
    selectedProducerId = producers[0]?.id ?? null;
  }

  producerShortage.textContent = unassignedBands.length
    ? `${unassignedBands.length} band${unassignedBands.length === 1 ? '' : 's'} need a producer`
    : 'Every band has a producer';

  producerContent.innerHTML = `
    <div class="producer-groups">
      <section>
        <h3>Producer only</h3>
        <div class="list">${producerRows(producerOnly)}</div>
      </section>
      <section>
        <h3>Performer + Producer</h3>
        <div class="list">${producerRows(performerProducers)}</div>
      </section>
    </div>
    ${needsReview.length ? `<section class="producer-review"><h3>Signup answers need review</h3><div class="list">${needsReview.map((producer) => `<div class="list-row"><strong>${escapeHtml(producer.name)}</strong><span class="status">Needs review</span><small>${escapeHtml(producer.reason)}</small></div>`).join('')}</div></section>` : ''}
    ${renderProducerDetail(producers.find((producer) => producer.id === selectedProducerId), directory.bands || [])}
  `;

  producerContent.querySelectorAll('[data-producer-select]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedProducerId = Number(button.dataset.producerSelect);
      renderProducers(directory, request, loadDashboard);
    });
  });

  producerContent.querySelectorAll('[data-producer-assign]').forEach((button) => {
    button.addEventListener('click', async () => {
      const bandId = document.querySelector('#producer-band-select')?.value;
      if (!bandId) {
        return;
      }

      try {
        await request(`/api/producers/${selectedProducerId}/bands/${bandId}`, { method: 'POST' });
        await loadDashboard();
      } catch (error) {
        showNotice(error.message);
      }
    });
  });

  producerContent.querySelectorAll('[data-producer-unassign]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await request(`/api/producers/${selectedProducerId}/bands/${button.dataset.producerUnassign}`, {
          method: 'DELETE',
        });
        await loadDashboard();
      } catch (error) {
        showNotice(error.message);
      }
    });
  });
}

function producerRows(producers) {
  if (!producers.length) {
    return '<p class="list-row muted">No sign-ups in this group.</p>';
  }

  return producers.map((producer) => {
    const capacity = producer.capacityStatus;
    const capacityLabel = capacity.overCapacityCount
      ? `Over capacity by ${capacity.overCapacityCount}`
      : capacity.remainingCapacity === 0
        ? 'At capacity'
        : `${capacity.remainingCapacity} remaining`;

    return `<div class="list-row producer-row"><div><strong>${escapeHtml(producer.name)}</strong><small>${escapeHtml(producer.role)}</small></div><div><strong>${capacity.assignedBandCount} / ${producer.maximumCapacity} bands</strong><small>${escapeHtml(producer.additionalTeamsAnswer)}</small></div><span class="status status-${escapeHtml(capacity.state)}">${escapeHtml(capacityLabel)}</span><button class="button button-quiet" type="button" data-producer-select="${producer.id}" aria-pressed="${producer.id === selectedProducerId}">Open</button></div>`;
  }).join('');
}

function renderProducerDetail(producer, bands) {
  if (!producer) {
    return '<p class="muted producer-empty">Import registrations to see signup-identified producers here.</p>';
  }

  const assignedIds = new Set(producer.assignments.map((band) => band.id));
  const availableBands = bands.filter((band) => !band.producer);
  const capacity = producer.capacityStatus;
  const capacityText = capacity.overCapacityCount
    ? `${capacity.overCapacityCount} over maximum of ${producer.maximumCapacity}`
    : capacity.remainingCapacity === 0
      ? `At maximum of ${producer.maximumCapacity}`
      : `${capacity.remainingCapacity} of ${producer.maximumCapacity} slots remaining`;
  const assignments = producer.assignments.length
    ? producer.assignments.map((band) => `<div class="list-row"><strong>${escapeHtml(band.name)}</strong><span class="status">${band.source === 'manual' ? 'Hand assigned' : 'Matched'}</span><button class="button button-quiet" type="button" data-producer-unassign="${band.id}">Remove</button></div>`).join('')
    : '<p class="list-row muted">No bands assigned.</p>';
  const bandOptions = availableBands.map((band) =>
    `<option value="${band.id}">${escapeHtml(band.name)}</option>`).join('');
  const canAssign = availableBands.length > 0 && capacity.remainingCapacity > 0;
  const warning = capacity.state === 'over-capacity'
    ? `<p class="notice">This producer is over the signup capacity by ${capacity.overCapacityCount} band${capacity.overCapacityCount === 1 ? '' : 's'}. Remove an assignment before adding another.</p>`
    : capacity.state === 'at-capacity'
      ? '<p class="notice">This producer is at capacity. Remove an assignment before adding another.</p>'
      : capacity.state === 'one-remaining'
        ? '<p class="notice">One assignment remains before this producer reaches capacity.</p>'
        : '';
  const firstComeNotice = capacity.firstComeFirstServeNotice
    ? `<p class="notice">${escapeHtml(capacity.firstComeFirstServeNotice)}</p>`
    : '';
  const producerBandCount = bands.filter((band) => assignedIds.has(band.id)).length;

  return `<section class="producer-detail"><div class="section-heading"><div><p class="eyebrow">PRODUCER ASSIGNMENTS</p><h3>${escapeHtml(producer.name)}</h3><p class="muted">${escapeHtml(producer.role)} · Signup answer: ${escapeHtml(producer.roleAnswer)}</p></div><span class="status status-${escapeHtml(capacity.state)}">${producerBandCount} assigned · ${escapeHtml(capacityText)}</span></div>${warning}${firstComeNotice}<h4>Assigned bands</h4><div class="list">${assignments}</div><div class="section-actions producer-assign-actions"><label for="producer-band-select">Assign a band</label><select id="producer-band-select" class="search" ${canAssign ? '' : 'disabled'}>${bandOptions || '<option value="">No unassigned bands</option>'}</select><button class="button button-primary" type="button" data-producer-assign ${canAssign ? '' : 'disabled'}>Assign band</button></div></section>`;
}

function showNotice(message) {
  const notice = document.querySelector('#notice');
  notice.hidden = false;
  notice.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}