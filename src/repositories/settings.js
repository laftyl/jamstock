function createSettingsRepository(db) {
  const getStatement = db.prepare('SELECT value FROM settings WHERE key = ?');
  const setStatement = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const saveMany = db.transaction((entries) => {
    for (const [key, value] of entries) {
      setStatement.run(key, value);
    }
  });

  return {
    get(key) {
      return getStatement.get(key)?.value ?? null;
    },
    saveMany,
    set(key, value) {
      setStatement.run(key, value);
    },
  };
}

module.exports = { createSettingsRepository };