const { readFormValue } = require('./parse');
const { createMatchingScorer, createProducerCapacityStatus } = require('./scoring');

function createProducerDirectory(participantRows, overrideRows, bandRows, instrumentMappings) {
  const overrideById = new Map(overrideRows.map((override) => [override.participantId, override]));
  const assignmentsByProducer = new Map();
  const assignmentByBand = new Map();

  for (const band of bandRows) {
    for (const producer of band.producers) {
      const assignment = {
        id: band.id,
        name: band.name,
        source: producer.assignment_source || 'algorithm',
      };
      addToMapList(assignmentsByProducer, producer.id, assignment);
      assignmentByBand.set(band.id, { producerId: producer.id, source: assignment.source });
    }
  }

  const scorer = createMatchingScorer(instrumentMappings);
  const profiles = participantRows
    .filter((participant) => participant.status === 'eligible')
    .map((participant) => scorer.prepareParticipant({
      ...participant,
      producerOverride: overrideById.get(participant.id),
    }));
  const producers = profiles.filter((profile) => profile.isProducer)
    .map((profile) => createProducerView(
      profile,
      assignmentsByProducer.get(profile.id) || [],
      overrideById.has(profile.id),
    ));
  const needsReview = profiles.filter((profile) => profile.producerNeedsReview)
    .map(createProducerReview);
  const bands = bandRows.map((band) => ({
    id: band.id,
    name: band.name,
    producer: assignmentByBand.get(band.id) || null,
  }));

  return { producers, needsReview, bands };
}

function createProducerView(profile, assignments, hasOverride) {
  const roleAnswer = readFormValue(profile.raw,
    'Performer + Producer, or Producer only?',
    'Would you like to be both a performer and producer, or focus primarily on production?',
    'Would you like to be both a performer and producer, or focus primarily on production? *');
  const additionalTeamsAnswer = readFormValue(profile.raw,
    'If short on producers, open to producing for additional teams?',
    'If this event is short on producers, would you be open to producing for additional teams?',
    'If this event is short on producers, would you be open to producing for additional teams? *');
  const name = profile.displayName || `Participant ${profile.id}`;

  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    name,
    role: profile.producerOnly ? 'Producer only' : 'Performer + Producer',
    roleAnswer: roleAnswer || 'Needs review',
    additionalTeamsAnswer: additionalTeamsAnswer || 'Needs review',
    additionalTeamsOpen: profile.additionalTeamsOpen,
    maximumCapacity: profile.producerCapacity,
    assignments,
    capacityStatus: createProducerCapacityStatus(name, assignments.length, profile.producerCapacity),
    hasOverride,
  };
}

function createProducerReview(profile) {
  return {
    id: profile.id,
    name: profile.displayName || `Participant ${profile.id}`,
    reason: profile.producerReviewReason,
  };
}

function addToMapList(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

module.exports = { createProducerDirectory };