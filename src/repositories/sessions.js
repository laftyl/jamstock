function createSessionRepository(db) {
  const insertSession = db.prepare('INSERT OR REPLACE INTO sessions (token_hash) VALUES (?)');
  const findSession = db.prepare('SELECT 1 FROM sessions WHERE token_hash = ?');
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');

  return {
    create(tokenHash) {
      insertSession.run(tokenHash);
    },
    exists(tokenHash) {
      return Boolean(findSession.get(tokenHash));
    },
    remove(tokenHash) {
      deleteSession.run(tokenHash);
    },
  };
}

module.exports = { createSessionRepository };