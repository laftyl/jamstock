function createBandRepository(db) {
  const selectBands = db.prepare('SELECT * FROM bands ORDER BY id');
  const selectMembers = db.prepare(`
    SELECT band_members.band_id, participants.*
    FROM band_members
    JOIN participants ON participants.id = band_members.participant_id
    ORDER BY band_members.band_id, participants.id
  `);
  const selectExportRows = db.prepare(`
    SELECT bands.id AS band_id, bands.name, bands.locked, participants.first_name,
      participants.last_name, participants.email, participants.primary_instruments,
      participants.primary_instrument, participants.other_instruments
    FROM bands
    LEFT JOIN band_members ON band_members.band_id = bands.id
    LEFT JOIN participants ON participants.id = band_members.participant_id
    ORDER BY bands.id, participants.id
  `);
  const selectAssignments = db.prepare('SELECT band_id, participant_id FROM band_members');
  const selectNextGeneration = db.prepare('SELECT COALESCE(MAX(generation), 0) + 1 AS next FROM bands');
  const removeUnlockedMembers = db.prepare('DELETE FROM band_members WHERE band_id IN (SELECT id FROM bands WHERE locked = 0)');
  const removeUnlockedBands = db.prepare('DELETE FROM bands WHERE locked = 0');
  const insertBand = db.prepare('INSERT INTO bands (name, generation, seed) VALUES (?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO band_members (band_id, participant_id) VALUES (?, ?)');
  const lockBand = db.prepare('UPDATE bands SET locked = CASE locked WHEN 1 THEN 0 ELSE 1 END WHERE id = ?');
  const deleteMembers = db.prepare('DELETE FROM band_members');
  const deleteProducerAssignments = db.prepare('DELETE FROM producer_assignments');
  const deleteBands = db.prepare('DELETE FROM bands');

  const saveGeneration = db.transaction((plan, generation, seed) => {
    removeUnlockedMembers.run();
    removeUnlockedBands.run();

    for (const band of plan.generatedBands) {
      const result = insertBand.run(band.name, generation, seed);
      for (const member of band.members) {
        insertMember.run(result.lastInsertRowid, member.id);
      }
    }
  });
  const clear = db.transaction(() => {
    deleteProducerAssignments.run();
    deleteMembers.run();
    deleteBands.run();
  });

  function bandsWithMembers(lockedOnly = false) {
    const bands = lockedOnly
      ? selectBands.all().filter((band) => band.locked)
      : selectBands.all();
    const bandById = new Map(bands.map((band) => [band.id, { ...band, members: [] }]));

    for (const member of selectMembers.all()) {
      const band = bandById.get(member.band_id);
      if (!band) {
        continue;
      }

      const { band_id: bandId, ...participant } = member;
      band.members.push({ ...participant, band_id: bandId });
    }

    return [...bandById.values()];
  }

  return {
    allWithMembers() {
      return bandsWithMembers();
    },
    assignments() {
      return selectAssignments.all();
    },
    clear,
    exportRows() {
      return selectExportRows.all();
    },
    lockedWithMembers() {
      return bandsWithMembers(true);
    },
    lock(bandId) {
      return lockBand.run(bandId).changes;
    },
    nextGeneration() {
      return selectNextGeneration.get().next;
    },
    saveGenerationPlan: saveGeneration,
  };
}

module.exports = { createBandRepository };