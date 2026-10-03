const MIN_BAND_SIZE = 3;
const MAX_BAND_SIZE = 6;
const TARGET_BAND_SIZE = 5;
const MATCHING_TIMEOUT_MS = 10_000;
const crypto = require('node:crypto');

function seedTieBreak(seed, participantId) {
  return crypto.createHash('sha256').update(`${seed}:${participantId}`).digest('hex');
}

function seededParticipantOrder(participants, seed) {
  return [...participants].sort((left, right) => {
    const leftKey = seedTieBreak(seed, left.id);
    const rightKey = seedTieBreak(seed, right.id);
    return leftKey.localeCompare(rightKey) || Number(left.id) - Number(right.id);
  });
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

function createGenerationPlan(participants, lockedBands, { seed = '' } = {}) {
  const lockedParticipantIds = new Set(
    lockedBands.flatMap((band) => band.members.map((member) => member.id)),
  );
  const producerOnlyParticipantIds = [];
  const availablePerformers = [];

  for (const participant of participants) {
    if (participant.producerOnly) {
      producerOnlyParticipantIds.push(participant.id);
      continue;
    }

    if (!lockedParticipantIds.has(participant.id)) {
      availablePerformers.push(participant);
    }
  }

  const seededPerformers = seededParticipantOrder(availablePerformers, seed);
  const sizes = bandSizes(seededPerformers.length);
  const generatedBands = [];
  let offset = 0;

  for (let index = 0; index < sizes.length; index += 1) {
    const size = sizes[index];
    generatedBands.push({
      name: `Band ${lockedBands.length + index + 1}`,
      members: seededPerformers.slice(offset, offset + size),
    });
    offset += size;
  }

  return {
    generatedBands,
    producerOnlyParticipantIds,
    unassignedParticipantIds: seededPerformers.slice(offset).map((person) => person.id),
  };
}

function assertOneBandPerPerformer(assignments) {
  const memberBandByParticipant = new Map();

  for (const assignment of assignments) {
    if (assignment.type === 'producer') {
      continue;
    }

    const existingBandId = memberBandByParticipant.get(assignment.participantId);
    if (existingBandId !== undefined && existingBandId !== assignment.bandId) {
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