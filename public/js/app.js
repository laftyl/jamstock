import { request } from './api.js';
import { bindAuthEvents, showAuth } from './auth.js';
import { bindBandEvents, renderBands } from './bands.js';
import { bindImportEvents } from './imports.js';
import { bindParticipantEvents, renderParticipants } from './participants.js';

const state = { mode: 'login', authenticated: false };

async function loadDashboard() {
  const data = await request('/api/dashboard');
  document.querySelector('#eligible-count').textContent = data.eligible;
  document.querySelector('#checked-in-count').textContent = data.checkedIn;
  document.querySelector('#band-count').textContent = data.bands;
  document.querySelector('#issue-count').textContent = data.issues;
  renderParticipants(data.participants, request, loadDashboard);
  renderBands(data.bandDetails, request, loadDashboard);
}

function showDashboard(panelId = 'overview-panel') {
  state.authenticated = true;
  document.querySelector('#auth-view').hidden = true;
  document.querySelector('#dashboard-view').hidden = false;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.panel === panelId);
  });
  setVisiblePanel(panelId);
  loadDashboard();
}

function setVisiblePanel(panelId) {
  document.querySelectorAll('.content-panel, .panel-grid').forEach((panel) => {
    panel.hidden = panel.id !== panelId;
  });
}

function bindNavigation() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((item) => item.classList.remove('is-active'));
      tab.classList.add('is-active');
      setVisiblePanel(tab.dataset.panel);
    });
  });
}

bindAuthEvents(state, request, showDashboard);
bindBandEvents(request, loadDashboard);
bindImportEvents(request, loadDashboard);
bindParticipantEvents(request, async (participants) => {
  if (participants) {
    renderParticipants(participants, request, loadDashboard);
    return;
  }
  await loadDashboard();
});
bindNavigation();

request('/api/auth/status')
  .then((data) => showAuth(state, data.configured ? 'login' : 'setup'))
  .catch((error) => {
    showAuth(state, 'setup');
    document.querySelector('#auth-error').textContent = error.message;
  });