const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const express = require('express');
const { createAuthService } = require('../src/auth');
const { migrateDatabase } = require('../src/db');
const { createRepositories } = require('../src/repositories');
const { createAuthRouter } = require('../src/routes/auth');
const { createBandsRouter } = require('../src/routes/bands');
const { createImportRouter } = require('../src/routes/import');
const { createParticipantsRouter } = require('../src/routes/participants');
const { createWorkspaceRouter } = require('../src/routes/workspace');

test('import, check-in, dashboard, locked generation, and logout work end-to-end', async (context) => {
  const db = new Database(':memory:');
  migrateDatabase(db);
  const repositories = createRepositories(db);
  repositories.instruments.ensureDefaults();
  const authService = createAuthService(repositories.settings, repositories.sessions);
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api', createParticipantsRouter(authService, repositories));
  app.use('/api/import', createImportRouter(authService, repositories.participants));
  app.use('/api/bands', createBandsRouter(authService, repositories));
  app.use('/api', createWorkspaceRouter(authService, repositories.workspace));

  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  context.after(() => {
    server.close();
    db.close();
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const setup = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: 'test-password-123',
      answers: ['answer one', 'answer two', 'answer three'],
    }),
  });
  assert.equal(setup.status, 200);
  const { token } = await setup.json();
  const headers = { Authorization: token };
  const newAuthService = createAuthService(
    createRepositories(db).settings,
    createRepositories(db).sessions,
  );
  assert.equal(newAuthService.isSessionValid(token), true);

  const importForm = new FormData();
  importForm.append('file', new Blob([registrationCsv()], { type: 'text/csv' }), 'entries.csv');
  const previewResponse = await fetch(`${baseUrl}/api/import/preview`, {
    method: 'POST',
    headers,
    body: importForm,
  });
  assert.equal(previewResponse.status, 200);
  const preview = await previewResponse.json();
  assert.equal(preview.valid, 8);
  assert.deepEqual(preview.rows[0].primary_instruments, ['Guitarist', 'Bassist']);

  const commitResponse = await fetch(`${baseUrl}/api/import/commit`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(preview.rows),
  });
  assert.deepEqual(await commitResponse.json(), { ok: true, inserted: 8, duplicates: 0 });

  const checkInResponse = await fetch(`${baseUrl}/api/participants/check-in-all`, {
    method: 'POST',
    headers,
  });
  assert.equal((await checkInResponse.json()).count, 8);

  const generationResponse = await fetch(`${baseUrl}/api/bands/generate`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed: 'first-seed' }),
  });
  assert.equal(generationResponse.status, 200);
  assert.equal((await generationResponse.json()).seed, 'first-seed');

  let dashboardResponse = await fetch(`${baseUrl}/api/dashboard`, { headers });
  let dashboard = await dashboardResponse.json();
  assert.equal(dashboard.participants.length, 8);
  assert.deepEqual(dashboard.participants[0].primary_instruments, ['Guitarist', 'Bassist']);
  assert.equal(dashboard.bandDetails.reduce((total, band) => total + band.members.length, 0), 7);

  const lockedBand = dashboard.bandDetails[0];
  const lockResponse = await fetch(`${baseUrl}/api/bands/${lockedBand.id}/lock`, {
    method: 'POST',
    headers,
  });
  assert.equal((await lockResponse.json()).ok, true);

  const regenerateResponse = await fetch(`${baseUrl}/api/bands/generate`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed: 'second-seed' }),
  });
  assert.equal(regenerateResponse.status, 200);
  dashboardResponse = await fetch(`${baseUrl}/api/dashboard`, { headers });
  dashboard = await dashboardResponse.json();

  const assignedParticipantIds = dashboard.bandDetails.flatMap((band) =>
    band.members.map((member) => member.id));
  assert.equal(new Set(assignedParticipantIds).size, assignedParticipantIds.length);
  assert.equal(assignedParticipantIds.length, 7);
  assert.equal(dashboard.bandDetails.find((band) => band.id === lockedBand.id).seed, 'first-seed');
  assert.equal(dashboard.bandDetails.filter((band) => band.seed === 'second-seed').length, 1);

  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers,
  });
  assert.equal(logoutResponse.status, 200);
  const unauthorizedResponse = await fetch(`${baseUrl}/api/dashboard`, { headers });
  assert.equal(unauthorizedResponse.status, 401);
});

function registrationCsv() {
  const headers = [
    'First name',
    'Last name',
    'Email',
    'Are you 21 or older?',
    'Have you purchased your event ticket?',
    'Do you have reliable transportation to meet the required in-person portions of the event?',
    'Are you committed to being a reliable bandmate for the full 48 hours of this event?',
    'How much music experience do you have?',
    'What is your primary instrument? (Check all that apply)',
    'What hours are you free during the 48-hour event? (Check all that apply)',
    'Do you have mixing skills AND want to mix for this event?',
    'Performer + Producer, or Producer only?',
  ];
  const rows = Array.from({ length: 8 }, (_, index) => [
    `Player${index + 1}`,
    'Test',
    `player${index + 1}@example.com`,
    'Yes',
    'Yes',
    'Yes',
    'Yes',
    'Beginner',
    index === 7 ? 'Recording/Mixing engineer' : 'Guitarist, Bassist',
    'Friday evening, Saturday morning, Saturday afternoon, Saturday evening, Sunday morning, Sunday afternoon, Sunday evening',
    index === 7 ? 'Yes' : '',
    index === 7 ? 'Producer only' : '',
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function escapeCsv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}