const express = require('express');
const { requireAuth } = require('../auth');
const { producerOnly, readRawParticipant } = require('../participants');
const { assertOneBandPerPerformer, createGenerationPlan } = require('../matching');
const { parsePrimaryInstruments } = require('../parse');

function createBandsRouter(authService, repositories) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.post('/generate', (request, response) => {
    const participants = repositories.participants.checkedInEligible();
    const lockedBands = repositories.bands.lockedWithMembers();
    const generationPlan = createGenerationPlan(
      participants.map((participant) => ({
        ...participant,
        producerOnly: producerOnly(participant),
        raw: readRawParticipant(participant),
      })),
      lockedBands,
    );
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

    const seed = typeof request.body?.seed === 'string' ? request.body.seed.trim() : '';
    repositories.bands.saveGenerationPlan(
      generationPlan,
      repositories.bands.nextGeneration(),
      seed,
    );

    response.json({
      ok: true,
      message: `Draft generated from ${generatedPerformerCount} checked-in performers.`,
      seed,
      producerOnlyUnassigned: generationPlan.producerOnlyParticipantIds.length,
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