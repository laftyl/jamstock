const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { migrateDatabase } = require('../src/db');

test('migration adds normalized columns without losing legacy participant data', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE participants (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      primary_instrument TEXT,
      availability TEXT,
      raw_json TEXT NOT NULL
    );
    INSERT INTO participants (
      id, first_name, last_name, email, primary_instrument, availability, raw_json
    ) VALUES (
      1, 'Ada', 'Keys', 'ada@example.com', 'Guitarist, Bassist',
      'Friday evening, Sunday afternoon', '{}'
    );
    CREATE TABLE bands (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0,
      generation INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  migrateDatabase(db);

  const participant = db.prepare('SELECT * FROM participants WHERE id = 1').get();
  const bandColumns = db.pragma('table_info(bands)').map((column) => column.name);
  assert.deepEqual(JSON.parse(participant.primary_instruments), ['Guitarist', 'Bassist']);
  assert.equal(participant.availability_mask, 33);
  assert.ok(bandColumns.includes('seed'));
  assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'sessions'").get());
  db.close();
});