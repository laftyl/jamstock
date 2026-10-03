function createParticipantRepository(db) {
  const selectParticipants = db.prepare('SELECT * FROM participants ORDER BY last_name, first_name');
  const selectCheckedIn = db.prepare("SELECT * FROM participants WHERE status = 'eligible' AND checked_in = 1 ORDER BY id");
  const checkIn = db.prepare('UPDATE participants SET checked_in = CASE checked_in WHEN 1 THEN 0 ELSE 1 END WHERE id = ?');
  const checkInAll = db.prepare("UPDATE participants SET checked_in = 1 WHERE status = 'eligible'");
  const insertParticipant = db.prepare(`
    INSERT OR IGNORE INTO participants (
      first_name, last_name, email, experience, primary_instrument, primary_instruments,
      other_instruments, skills, genres, availability, availability_mask, status, raw_json
    ) VALUES (
      @first_name, @last_name, @email, @experience, @primary_instrument, @primary_instruments,
      @other_instruments, @skills, @genres, @availability, @availability_mask, @status, @raw_json
    )
  `);
  const saveParticipants = db.transaction((participants) => {
    let inserted = 0;
    let duplicates = 0;

    for (const participant of participants) {
      if (participant.status !== 'eligible') {
        continue;
      }

      const result = insertParticipant.run({
        ...participant,
        primary_instruments: JSON.stringify(participant.primary_instruments ?? []),
        availability_mask: participant.availability_mask ?? 0,
      });

      if (result.changes) {
        inserted += 1;
      } else {
        duplicates += 1;
      }
    }

    return { inserted, duplicates };
  });
  const clearParticipants = db.prepare('DELETE FROM participants');

  return {
    all() {
      return selectParticipants.all();
    },
    checkedInEligible() {
      return selectCheckedIn.all();
    },
    checkIn(participantId) {
      return checkIn.run(participantId).changes;
    },
    checkInAll() {
      return checkInAll.run().changes;
    },
    clear() {
      clearParticipants.run();
    },
    saveParticipants,
  };
}

module.exports = { createParticipantRepository };