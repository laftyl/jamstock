const express = require('express');
const { requireAuth } = require('../auth');
const { displayParticipant } = require('../participants');
const { createBandFlags, createMatchingScorer } = require('../scoring');

function createParticipantsRouter(authService, repositories) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.get('/dashboard', (request, response) => {
    const participants = repositories.participants.all().map(displayParticipant);
    const bands = repositories.bands.allWithMembers();
    const scorer = createMatchingScorer(repositories.instruments.all());
    const bandDetails = bands.map((band) => ({
      ...band,
      members: band.members.map(displayParticipant),
      producers: band.producers.map(displayParticipant),
      flags: createBandFlags(band, scorer),
    }));

    response.json({
      eligible: participants.filter((participant) => participant.status === 'eligible').length,
      checkedIn: participants.filter((participant) => participant.checked_in).length,
      issues: participants.filter((participant) => participant.status !== 'eligible').length,
      bands: bands.length,
      participants,
      bandDetails,
    });
  });

  router.post('/participants/:id/check-in', (request, response) => {
    repositories.participants.checkIn(request.params.id);
    response.json({ ok: true });
  });

  router.post('/participants/check-in-all', (request, response) => {
    const count = repositories.participants.checkInAll();
    response.json({ ok: true, count });
  });

  return router;
}

module.exports = { createParticipantsRouter };