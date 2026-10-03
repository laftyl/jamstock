const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { availabilityMask, parseCheckboxValues } = require('./parse');

function openDatabase(databasePath) {
  const existedBeforeOpen = fs.existsSync(databasePath) && fs.statSync(databasePath).size > 0;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');

  if (existedBeforeOpen && hasPendingMigration(db)) {
    createTimestampedBackup(db, databasePath);
  }

  migrateDatabase(db);
  return db;
}

function hasPendingMigration(db) {
  return !hasColumn(db, 'participants', 'primary_instruments')
    || !hasColumn(db, 'participants', 'availability_mask')
    || !hasColumn(db, 'bands', 'seed')
    || !hasColumn(db, 'producer_assignments', 'source')
    || !tableExists(db, 'sessions')
    || !tableExists(db, 'instrument_mappings')
    || !tableExists(db, 'producer_assignments')
    || !tableExists(db, 'producer_overrides');
}

function createTimestampedBackup(db, databasePath) {
  const backupDirectory = path.join(path.dirname(databasePath), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDirectory, `jamstock-${timestamp}.db`);

  fs.mkdirSync(backupDirectory, { recursive: true });
  db.pragma('wal_checkpoint(TRUNCATE)');
  fs.copyFileSync(databasePath, backupPath);
}

function migrateDatabase(db) {
  const participantColumns = new Set(
    db.pragma('table_info(participants)').map((column) => column.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      experience TEXT,
      primary_instrument TEXT,
      primary_instruments TEXT NOT NULL DEFAULT '[]',
      other_instruments TEXT,
      skills TEXT,
      genres TEXT,
      availability TEXT,
      availability_mask INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'eligible',
      checked_in INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0,
      generation INTEGER NOT NULL DEFAULT 1,
      seed TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS band_members (
      band_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      PRIMARY KEY (band_id, participant_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS instrument_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      pattern TEXT NOT NULL,
      pattern_type TEXT NOT NULL DEFAULT 'regex',
      primary_roles TEXT NOT NULL DEFAULT '[]',
      secondary_roles TEXT NOT NULL DEFAULT '[]',
      tertiary_roles TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS producer_assignments (
      band_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'algorithm',
      PRIMARY KEY (band_id, participant_id)
    );
    CREATE TABLE IF NOT EXISTS producer_overrides (
      participant_id INTEGER PRIMARY KEY,
      producer_only INTEGER NOT NULL,
      additional_teams_open INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  addColumnIfMissing(db, 'participants', 'primary_instruments', "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing(db, 'participants', 'availability_mask', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'bands', 'seed', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'producer_assignments', 'source', "TEXT NOT NULL DEFAULT 'algorithm'");

  if (!participantColumns.has('primary_instruments') || !participantColumns.has('availability_mask')) {
    migrateParticipantCheckboxes(db, participantColumns);
  }
}

function migrateParticipantCheckboxes(db, originalColumns) {
  const participants = db.prepare('SELECT id, primary_instrument, availability FROM participants').all();
  const update = db.prepare(`
    UPDATE participants
    SET primary_instruments = ?, availability_mask = ?
    WHERE id = ?
  `);

  for (const participant of participants) {
    const instruments = originalColumns.has('primary_instrument')
      ? parseCheckboxValues(participant.primary_instrument)
      : [];
    const mask = originalColumns.has('availability')
      ? availabilityMask(participant.availability)
      : 0;
    update.run(JSON.stringify(instruments), mask, participant.id);
  }
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  if (!hasColumn(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function hasColumn(db, tableName, columnName) {
  return db.pragma(`table_info(${tableName})`).some((column) => column.name === columnName);
}

function tableExists(db, tableName) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName));
}

module.exports = {
  hasPendingMigration,
  migrateDatabase,
  openDatabase,
};