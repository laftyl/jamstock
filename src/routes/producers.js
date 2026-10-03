const express = require('express');
const { requireAuth } = require('../auth');
const { createProducerDirectory } = require('../producers');

function createProducersRouter(authService, repositories) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.get('/', (request, response) => {
    response.json(readProducerDirectory(repositories));
  });

  router.post('/:producerId/bands/:bandId', (request, response) => {
    const producerId = parsePositiveId(request.params.producerId);
    const bandId = parsePositiveId(request.params.bandId);

    if (!producerId || !bandId) {
      return response.status(400).json({ error: 'Choose a valid producer and band.' });
    }

    const directory = readProducerDirectory(repositories);
    const producer = directory.producers.find((candidate) => candidate.id === producerId);
    const band = directory.bands.find((candidate) => candidate.id === bandId);

    if (!producer) {
      return response.status(404).json({ error: 'That participant is not a recognized producer.' });
    }

    if (!band) {
      return response.status(404).json({ error: 'Band not found.' });
    }

    if (band.producer) {
      return response.status(409).json({ error: 'Remove the current producer before assigning another.' });
    }

    if (producer.capacityStatus.assignedBandCount >= producer.maximumCapacity) {
      return response.status(409).json({
        error: `${producer.name} is at the maximum capacity of ${producer.maximumCapacity} bands.`,
      });
    }

    repositories.bands.assignProducer(bandId, producerId, 'manual');
    response.json(readProducerDirectory(repositories));
  });

  router.delete('/:producerId/bands/:bandId', (request, response) => {
    const producerId = parsePositiveId(request.params.producerId);
    const bandId = parsePositiveId(request.params.bandId);

    if (!producerId || !bandId) {
      return response.status(400).json({ error: 'Choose a valid producer and band.' });
    }

    const directory = readProducerDirectory(repositories);
    const producer = directory.producers.find((candidate) => candidate.id === producerId);
    const assignment = producer?.assignments.find((candidate) => candidate.id === bandId);

    if (!assignment) {
      return response.status(404).json({ error: 'That producer is not assigned to this band.' });
    }

    repositories.bands.unassignProducer(bandId, producerId);
    response.json(readProducerDirectory(repositories));
  });

  return router;
}

function readProducerDirectory(repositories) {
  return createProducerDirectory(
    repositories.participants.all(),
    repositories.participants.producerOverrides(),
    repositories.bands.allWithMembers(),
    repositories.instruments.all(),
  );
}

function parsePositiveId(value) {
  const parsedId = Number(value);
  return Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

module.exports = { createProducersRouter };