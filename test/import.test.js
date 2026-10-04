const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Database = require('better-sqlite3');
const { migrateDatabase } = require('../src/db');
const { classifyParticipant } = require('../src/parse');
const { parseSpreadsheet } = require('../src/routes/import');
const { createParticipantRepository } = require('../src/repositories/participants');

const samplePath = path.join(__dirname, '..', 'Sample_Data', 'ideal_scenario_100_entries.csv');

test('a spreadsheet import parses and saves every eligible registration', () => {
  const rows = parseSpreadsheet(fs.readFileSync(samplePath), 'ideal.csv').map(classifyParticipant);
  const eligible = rows.filter((row) => row.status === 'eligible');
  assert.ok(eligible.length > 0, 'sample file should contain eligible rows');

  const db = new Database(':memory:');
  migrateDatabase(db);
  const participants = createParticipantRepository(db);

  const firstPass = participants.saveParticipants(rows);
  assert.equal(firstPass.inserted, eligible.length);
  assert.equal(firstPass.duplicates, 0);
  assert.equal(participants.all().length, eligible.length);

  const secondPass = participants.saveParticipants(rows);
  assert.equal(secondPass.inserted, 0);
  assert.equal(secondPass.duplicates, eligible.length);

  for (const saved of participants.all()) {
    assert.ok(Array.isArray(JSON.parse(saved.primary_instruments)));
    assert.equal(typeof saved.availability_mask, 'number');
  }

  db.close();
});
