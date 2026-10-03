function createParticipantRepository(db) {
  const selectParticipants = db.prepare('SELECT * FROM participants ORDER BY last_name, first_name');
  const selectCheckedIn = db.prepare("SELECT * FROM participants WHERE status = 'eligible' AND checked_in = 1 ORDER BY id");
  const checkIn = db.prepare('UPDATE participants SET checked_in = CASE checked_in WHEN 1 THEN 0 ELSE 1 END WHERE id = ?');
  const checkInAll = db.prepare("UPDATE participants SET checked_in = 1 WHERE status = 'eligible'");
  const selectProducerOverrides = db.prepare(`
    SELECT participant_id, producer_only, additional_teams_open, updated_at
    FROM producer_overrides ORDER BY participant_id
  `);
  const selectProducerOverride = db.prepare(`
    SELECT participant_id, producer_only, additional_teams_open, updated_at
    FROM producer_overrides WHERE participant_id = ?
  `);
  const selectParticipantById = db.prepare('SELECT * FROM participants WHERE id = ?');
  const saveProducerOverride = db.prepare(`
    INSERT INTO producer_overrides (participant_id, producer_only, additional_teams_open)
    VALUES (?, ?, ?)
    ON CONFLICT (participant_id) DO UPDATE SET
      producer_only = excluded.producer_only,
      additional_teams_open = excluded.additional_teams_open,
      updated_at = CURRENT_TIMESTAMP
  `);
  const deleteProducerOverride = db.prepare('DELETE FROM producer_overrides WHERE participant_id = ?');
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
    byId(participantId) {
      return selectParticipantById.get(participantId);
    },
    producerOverride(participantId) {
      const override = selectProducerOverride.get(participantId);
      return override ? {
        producerOnly: Boolean(override.producer_only),
        additionalTeamsOpen: Boolean(override.additional_teams_open),
        updatedAt: override.updated_at,
      } : null;
    },
    producerOverrides() {
      return selectProducerOverrides.all().map((override) => ({
        participantId: override.participant_id,
        producerOnly: Boolean(override.producer_only),
        additionalTeamsOpen: Boolean(override.additional_teams_open),
        updatedAt: override.updated_at,
      }));
    },
    saveProducerOverride(participantId, override) {
      return saveProducerOverride.run(
        participantId,
        Number(override.producerOnly),
        Number(override.additionalTeamsOpen),
      ).changes;
    },
    clearProducerOverride(participantId) {
      return deleteProducerOverride.run(participantId).changes;
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