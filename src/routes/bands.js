const express = require('express');
const { requireAuth } = require('../auth');
const { readRawParticipant } = require('../participants');
const { assertOneBandPerPerformer, createGenerationPlan } = require('../matching');
const { parsePrimaryInstruments } = require('../parse');
const { createBandFlags, createMatchingScorer, createUnassignedFlags } = require('../scoring');

function createBandsRouter(authService, repositories) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.post('/generate', (request, response) => {
    const seed = typeof request.body?.seed === 'string' ? request.body.seed.trim() : '';
    const checkedInParticipants = repositories.participants.checkedInEligible();
    const checkedInIds = new Set(checkedInParticipants.map((participant) => participant.id));
    const eligibleParticipants = repositories.participants.all()
      .filter((participant) => participant.status === 'eligible');
    const producerOverrides = new Map(repositories.participants.producerOverrides()
      .map((override) => [override.participantId, override]));
    const lockedBands = repositories.bands.lockedWithMembers();
    const previousUnlockedBands = repositories.bands.unlockedWithMembers()
      .sort((left, right) => Number(right.producers.some((producer) => producer.assignment_source === 'manual'))
        - Number(left.producers.some((producer) => producer.assignment_source === 'manual'))
        || left.id - right.id);
    const instrumentMappings = repositories.instruments.all();
    const scorer = createMatchingScorer(instrumentMappings);
    const generationParticipants = eligibleParticipants.map((participant) => {
      const raw = readRawParticipant(participant);
      const producerOverride = producerOverrides.get(participant.id);
      const profile = scorer.prepareParticipant({ ...participant, raw, producerOverride });
      return {
        ...participant,
        raw,
        producerOverride,
        producerOnly: profile.producerOnly,
        producerNeedsReview: profile.producerNeedsReview,
        performerEligible: checkedInIds.has(participant.id) && !profile.producerNeedsReview,
        isProducer: profile.isProducer,
      };
    }).filter((participant) => checkedInIds.has(participant.id) || participant.isProducer);
    const manualProducerAssignments = previousUnlockedBands.flatMap((band) =>
      band.producers.filter((producer) => producer.assignment_source === 'manual')
        .map((producer) => ({ bandId: band.id, producer })));
    const generationPlan = createGenerationPlan(
      generationParticipants,
      lockedBands,
      { seed, instrumentMappings, previousUnlockedBands, manualProducerAssignments },
    );
    const manualProducerBandCount = new Set(manualProducerAssignments.map((assignment) => assignment.bandId)).size;

    if (generationPlan.generatedBands.length < manualProducerBandCount) {
      return response.status(409).json({
        error: 'Regeneration would remove a hand-assigned producer band. Remove or move that assignment first.',
      });
    }

    const generatedPerformerCount = generationPlan.generatedBands
      .reduce((total, band) => total + band.members.length, 0);

    if (!generationPlan.generatedBands.length && !lockedBands.length) {
      return response.status(400).json({
        error: 'Check in at least three eligible checked-in performers first.',
      });
    }

    const assignments = [
      ...lockedBands.flatMap((band) => band.members.map((member) => ({
        type: 'member',
        participantId: member.id,
        bandId: band.id,
      }))),
      ...generationPlan.generatedBands.flatMap((band, index) => band.members.map((member) => ({
        type: 'member',
        participantId: member.id,
        bandId: `new-${index}`,
      }))),
    ];
    assertOneBandPerPerformer(assignments);

    const createdBandIds = repositories.bands.saveGenerationPlan(
      generationPlan,
      repositories.bands.nextGeneration(),
      seed,
    );
    const flags = generationPlan.generatedBands.flatMap((band, index) => createBandFlags({
      ...band,
      id: createdBandIds[index],
    }, scorer));
    const unassignedParticipants = checkedInParticipants.filter((participant) =>
      generationPlan.unassignedParticipantIds.includes(participant.id));
    flags.push(...createUnassignedFlags(unassignedParticipants));
    const assignedProducerIds = new Set(generationPlan.generatedBands.flatMap((band) =>
      band.producers.map((producer) => producer.id)));
    const unassignedProducerOnlyIds = generationPlan.producerOnlyParticipantIds
      .filter((participantId) => !assignedProducerIds.has(participantId));

    response.json({
      ok: true,
      message: `Draft generated from ${generatedPerformerCount} checked-in performers.`,
      seed,
      producerOnlyUnassigned: unassignedProducerOnlyIds.length,
      producerOnlyUnassignedIds: unassignedProducerOnlyIds,
      producerReviewParticipantIds: generationPlan.producerReviewParticipantIds,
      producerShortage: generationPlan.producerShortage,
      unassignedParticipantIds: generationPlan.unassignedParticipantIds,
      timedOut: generationPlan.timedOut,
      flags,
    });
  });

  router.post('/clear', (request, response) => {
    repositories.bands.clear();
    response.json({ ok: true });
  });

  router.post('/:id/lock', (request, response) => {
    repositories.bands.lock(request.params.id);
    response.json({ ok: true });
  });

  router.patch('/:id/name', (request, response) => {
    const bandId = Number(request.params.id);
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    if (!Number.isSafeInteger(bandId) || bandId < 1 || !name || name.length > 80) {
      return response.status(400).json({ error: 'Enter a band name between 1 and 80 characters.' });
    }

    if (!repositories.bands.renameAndLock(bandId, name)) {
      return response.status(404).json({ error: 'Band not found.' });
    }

    response.json({ ok: true, id: bandId, name, locked: true });
  });

  router.get('/export', (request, response) => {
    const rows = [['Band', 'Status', 'First name', 'Last name', 'Email', 'Primary instruments', 'Other instruments']];
    const bandRows = repositories.bands.exportRows();

    for (const row of bandRows) {
      if (!row.first_name) {
        rows.push([row.name, row.locked ? 'Locked' : 'Draft', '', '', '', '', '']);
        continue;
      }

      rows.push([
        row.name,
        row.locked ? 'Locked' : 'Draft',
        row.first_name,
        row.last_name,
        row.email,
        parsePrimaryInstruments(row.primary_instruments, row.primary_instrument).join(', '),
        row.other_instruments,
      ]);
    }

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="jamstock-bands.csv"');
    response.send(csv);
  });

  return router;
}

function escapeCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

module.exports = { createBandsRouter };