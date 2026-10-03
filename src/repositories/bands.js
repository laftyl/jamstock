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
  const selectProducerAssignments = db.prepare(`
    SELECT producer_assignments.band_id, producer_assignments.source AS assignment_source, participants.*
    FROM producer_assignments
    JOIN participants ON participants.id = producer_assignments.participant_id
    ORDER BY producer_assignments.band_id, participants.id
  `);
  const selectProducerAssignmentRows = db.prepare(`
    SELECT producer_assignments.band_id, producer_assignments.participant_id,
      producer_assignments.source, bands.name AS band_name
    FROM producer_assignments
    JOIN bands ON bands.id = producer_assignments.band_id
    ORDER BY producer_assignments.participant_id, bands.id
  `);
  const selectUnlockedBandIds = db.prepare('SELECT id FROM bands WHERE locked = 0 ORDER BY id');
  const selectManualProducerBandIds = db.prepare(`
    SELECT DISTINCT band_id FROM producer_assignments
    WHERE source = 'manual' AND band_id IN (SELECT id FROM bands WHERE locked = 0)
  `);
  const selectBand = db.prepare('SELECT * FROM bands WHERE id = ?');
  const selectProducersForBand = db.prepare('SELECT participant_id, source FROM producer_assignments WHERE band_id = ? ORDER BY participant_id');
  const selectProducerLoad = db.prepare('SELECT COUNT(*) AS count FROM producer_assignments WHERE participant_id = ?');
  const selectNextGeneration = db.prepare('SELECT COALESCE(MAX(generation), 0) + 1 AS next FROM bands');
  const removeUnlockedMembers = db.prepare('DELETE FROM band_members WHERE band_id IN (SELECT id FROM bands WHERE locked = 0)');
  const removeUnlockedAlgorithmProducers = db.prepare("DELETE FROM producer_assignments WHERE source = 'algorithm' AND band_id IN (SELECT id FROM bands WHERE locked = 0)");
  const insertBand = db.prepare('INSERT INTO bands (name, generation, seed) VALUES (?, ?, ?)');
  const updateBand = db.prepare('UPDATE bands SET name = ?, generation = ?, seed = ? WHERE id = ? AND locked = 0');
  const insertMember = db.prepare('INSERT INTO band_members (band_id, participant_id) VALUES (?, ?)');
  const insertProducer = db.prepare(`
    INSERT INTO producer_assignments (band_id, participant_id, source) VALUES (?, ?, ?)
    ON CONFLICT (band_id, participant_id) DO UPDATE SET source = excluded.source
  `);
  const deleteProducerAssignment = db.prepare('DELETE FROM producer_assignments WHERE band_id = ? AND participant_id = ?');
  const deleteProducerAssignmentsForBand = db.prepare('DELETE FROM producer_assignments WHERE band_id = ?');
  const deleteBand = db.prepare('DELETE FROM bands WHERE id = ? AND locked = 0');
  const lockBand = db.prepare('UPDATE bands SET locked = CASE locked WHEN 1 THEN 0 ELSE 1 END WHERE id = ?');
  const renameAndLockBand = db.prepare('UPDATE bands SET name = ?, locked = 1 WHERE id = ?');
  const deleteMembers = db.prepare('DELETE FROM band_members');
  const deleteProducerAssignments = db.prepare('DELETE FROM producer_assignments');
  const deleteBands = db.prepare('DELETE FROM bands');

  const saveGeneration = db.transaction((plan, generation, seed) => {
    const existingBandIds = selectUnlockedBandIds.all().map((band) => band.id);
    const existingBandIdSet = new Set(existingBandIds);
    const manualProducerBandIds = new Set(selectManualProducerBandIds.all().map((row) => row.band_id));
    const retainedBandIds = new Set();
    removeUnlockedMembers.run();
    removeUnlockedAlgorithmProducers.run();
    const createdBandIds = [];

    for (const band of plan.generatedBands) {
      const reusableBandId = existingBandIdSet.has(band.existingBandId)
        ? band.existingBandId
        : null;
      const bandId = reusableBandId
        ? (updateBand.run(band.name, generation, seed, reusableBandId), reusableBandId)
        : insertBand.run(band.name, generation, seed).lastInsertRowid;
      retainedBandIds.add(bandId);
      createdBandIds.push(bandId);
      for (const member of band.members) {
        insertMember.run(bandId, member.id);
      }
      for (const producer of band.producers) {
        insertProducer.run(bandId, producer.id, producer.assignmentSource || 'algorithm');
      }
    }

    for (const bandId of existingBandIds) {
      if (retainedBandIds.has(bandId)) {
        continue;
      }
      if (manualProducerBandIds.has(bandId)) {
        throw new Error('Regeneration would remove a hand-assigned producer band. Remove or move that assignment first.');
      }
      deleteProducerAssignmentsForBand.run(bandId);
      deleteBand.run(bandId);
    }

    return createdBandIds;
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
    const bandById = new Map(bands.map((band) => [band.id, { ...band, members: [], producers: [] }]));

    for (const member of selectMembers.all()) {
      const band = bandById.get(member.band_id);
      if (!band) {
        continue;
      }

      const { band_id: bandId, ...participant } = member;
      band.members.push({ ...participant, band_id: bandId });
    }

    for (const producer of selectProducerAssignments.all()) {
      const band = bandById.get(producer.band_id);
      if (band) {
        const { band_id: bandId, ...participant } = producer;
        band.producers.push({ ...participant, band_id: bandId });
      }
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
    bandById(bandId) {
      return selectBand.get(bandId);
    },
    producerAssignments() {
      return selectProducerAssignmentRows.all();
    },
    producerForBand(bandId) {
      return selectProducersForBand.all(bandId);
    },
    producerLoadCount(participantId) {
      return selectProducerLoad.get(participantId).count;
    },
    assignProducer(bandId, participantId, source = 'manual') {
      return insertProducer.run(bandId, participantId, source).changes;
    },
    unassignProducer(bandId, participantId) {
      return deleteProducerAssignment.run(bandId, participantId).changes;
    },
    lockedWithMembers() {
      return bandsWithMembers(true);
    },
    unlockedWithMembers() {
      return bandsWithMembers().filter((band) => !band.locked);
    },
    lock(bandId) {
      return lockBand.run(bandId).changes;
    },
    renameAndLock(bandId, name) {
      return renameAndLockBand.run(name, bandId).changes;
    },
    nextGeneration() {
      return selectNextGeneration.get().next;
    },
    saveGenerationPlan: saveGeneration,
  };
}

module.exports = { createBandRepository };