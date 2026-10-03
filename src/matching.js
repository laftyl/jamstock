const MIN_BAND_SIZE = 3;
const MAX_BAND_SIZE = 6;
const TARGET_BAND_SIZE = 5;
const MATCHING_TIMEOUT_MS = 10_000;
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { compareScoreVectors, createInstrumentTally, createMatchingScorer } = require('./scoring');

function seedTieBreak(seed, participantId) {
  return crypto.createHash('sha256').update(`${seed}:${participantId}`).digest('hex');
}

function seededParticipantOrder(participants, seed) {
  return participants
    .map((participant) => ({ participant, key: seedTieBreak(seed, participant.id) }))
    .sort((left, right) => left.key.localeCompare(right.key)
      || Number(left.participant.id) - Number(right.participant.id))
    .map(({ participant }) => participant);
}

function bandSizes(total) {
  if (total < MIN_BAND_SIZE) {
    return [];
  }

  const fullBands = Math.floor(total / TARGET_BAND_SIZE);
  const remainder = total % TARGET_BAND_SIZE;
  const sizes = Array(fullBands).fill(TARGET_BAND_SIZE);

  if (remainder === 0) {
    return sizes;
  }

  if (remainder >= MIN_BAND_SIZE) {
    sizes.push(remainder);
    return sizes;
  }

  if (remainder === 1) {
    sizes[sizes.length - 1] += 1;
    return sizes;
  }

  sizes[sizes.length - 1] -= 1;
  sizes.push(MIN_BAND_SIZE);
  return sizes;
}

function createGenerationPlan(participants, lockedBands, options = {}) {
  const seed = String(options.seed ?? '');
  const timeBudgetMs = Math.min(options.timeBudgetMs ?? MATCHING_TIMEOUT_MS, MATCHING_TIMEOUT_MS);
  const now = options.now ?? performance.now.bind(performance);
  const startedAt = now();
  const scorer = createMatchingScorer(options.instrumentMappings ?? []);
  const profiles = participants.map(scorer.prepareParticipant);
  const lockedParticipantIds = new Set(
    lockedBands.flatMap((band) => band.members.map((member) => member.id)),
  );
  const producerOnlyParticipantIds = profiles
    .filter((participant) => participant.producerOnly)
    .map((participant) => participant.id);
  const producerReviewParticipantIds = profiles
    .filter((participant) => participant.producerNeedsReview)
    .map((participant) => participant.id);
  const availablePerformers = profiles.filter((participant) =>
    !participant.producerOnly
      && participant.performerEligible !== false
      && !lockedParticipantIds.has(participant.id));
  const instrumentCounts = createInstrumentTally(availablePerformers);
  const seededPerformers = seededParticipantOrder(availablePerformers, seed);
  const sizes = bandSizes(seededPerformers.length);
  const generatedBands = sizes.map((size, index) => ({
    existingBandId: options.previousUnlockedBands?.[index]?.id,
    name: `Band ${lockedBands.length + index + 1}`,
    members: [],
    producers: [],
    targetSize: size,
  }));
  const unassignedPerformers = [...seededPerformers];
  let timedOut = false;

  for (const band of generatedBands) {
    while (band.members.length < band.targetSize && unassignedPerformers.length) {
      let bestIndex = 0;
      let bestScore = null;

      for (let candidateIndex = 0; candidateIndex < unassignedPerformers.length; candidateIndex += 1) {
        if ((candidateIndex & 63) === 0 && now() - startedAt >= timeBudgetMs) {
          timedOut = true;
          break;
        }

        const score = scorer.scoreBandPlacement(
          unassignedPerformers[candidateIndex],
          band.members,
          { instrumentCounts },
        );
        if (bestScore === null || compareScoreVectors(score, bestScore) < 0) {
          bestIndex = candidateIndex;
          bestScore = score;
        }
      }

      band.members.push(unassignedPerformers.splice(bestIndex, 1)[0]);
      if (timedOut) {
        break;
      }
    }

    if (timedOut) {
      break;
    }
  }

  for (const band of generatedBands) {
    while (band.members.length < band.targetSize && unassignedPerformers.length) {
      band.members.push(unassignedPerformers.shift());
    }
    delete band.targetSize;
  }

  const manualProducerAssignments = options.manualProducerAssignments ?? [];
  const producerLoads = createProducerLoads(profiles, lockedBands, manualProducerAssignments);
  const manualAssignmentsByBand = new Map();

  for (const assignment of manualProducerAssignments) {
    if (!manualAssignmentsByBand.has(assignment.bandId)) {
      manualAssignmentsByBand.set(assignment.bandId, []);
    }
    manualAssignmentsByBand.get(assignment.bandId).push(assignment.producer);
  }

  for (const band of generatedBands) {
    const assignedProducers = manualAssignmentsByBand.get(band.existingBandId) ?? [];
    band.producers.push(...assignedProducers.map((producer) => ({
      ...producer,
      assignmentSource: 'manual',
    })));
  }

  const availableProducers = seededParticipantOrder(
    profiles.filter((participant) => participant.isProducer),
    seed,
  );
  assignProducers(generatedBands, availableProducers, producerLoads);

  return {
    generatedBands,
    producerOnlyParticipantIds,
    producerReviewParticipantIds,
    unassignedParticipantIds: unassignedPerformers.map((person) => person.id),
    producerShortage: generatedBands.filter((band) => !band.producers.length).length,
    timedOut,
  };
}

function createProducerLoads(profiles, lockedBands, manualProducerAssignments) {
  const producerById = new Map(profiles.filter((participant) => participant.isProducer)
    .map((participant) => [participant.id, participant]));
  const loads = new Map();

  for (const band of lockedBands) {
    for (const producer of band.producers || []) {
      const profile = producerById.get(producer.id);
      if (profile) {
        loads.set(profile.id, (loads.get(profile.id) ?? 0) + 1);
      }
    }
  }

  for (const assignment of manualProducerAssignments) {
    const profile = producerById.get(assignment.producer.id);
    if (profile) {
      loads.set(profile.id, (loads.get(profile.id) ?? 0) + 1);
    }
  }

  return loads;
}

function assignProducers(bands, producers, loads) {
  for (const band of bands) {
    if (band.producers.length) {
      continue;
    }

    const candidates = producers
      .filter((producer) => (loads.get(producer.id) ?? 0) < producer.producerCapacity)
      .sort((left, right) => {
        const loadDifference = (loads.get(left.id) ?? 0) / left.producerCapacity
          - (loads.get(right.id) ?? 0) / right.producerCapacity;
        return loadDifference;
      });
    const producer = candidates[0];

    if (!producer) {
      continue;
    }

    band.producers.push({ ...producer, assignmentSource: 'algorithm' });
    loads.set(producer.id, (loads.get(producer.id) ?? 0) + 1);
  }
}

function assertOneBandPerPerformer(assignments) {
  const memberBandByParticipant = new Map();

  for (const assignment of assignments) {
    if (assignment.type === 'producer') {
      continue;
    }

    const existingBandId = memberBandByParticipant.get(assignment.participantId);
    if (existingBandId !== undefined) {
      throw new Error(`Participant ${assignment.participantId} is assigned to multiple bands.`);
    }

    memberBandByParticipant.set(assignment.participantId, assignment.bandId);
  }
}

module.exports = {
  MATCHING_TIMEOUT_MS,
  assertOneBandPerPerformer,
  bandSizes,
  createGenerationPlan,
};