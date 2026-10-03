const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertOneBandPerPerformer,
  bandSizes,
  createGenerationPlan,
} = require('../src/matching');
const { DEFAULT_INSTRUMENT_MAPPINGS } = require('../src/instruments');
const { REQUIRED_ROLES, createMatchingScorer } = require('../src/scoring');

test('generation keeps each performer in one band when locked bands are preserved', () => {
  const lockedBands = [{ id: 1, members: [{ id: 1 }, { id: 2 }, { id: 3 }] }];
  const participants = Array.from({ length: 8 }, (_, index) => ({ id: index + 1 }));

  const plan = createGenerationPlan(participants, lockedBands);
  const assignments = [
    ...lockedBands.flatMap((band) => band.members.map((member) => ({
      type: 'member',
      participantId: member.id,
      bandId: band.id,
    }))),
    ...plan.generatedBands.flatMap((band, index) => band.members.map((member) => ({
      type: 'member',
      participantId: member.id,
      bandId: `new-${index}`,
    }))),
  ];

  assertOneBandPerPerformer(assignments);
  assert.deepEqual(
    plan.generatedBands.flatMap((band) => band.members.map((member) => member.id)).sort((left, right) => left - right),
    [4, 5, 6, 7, 8],
  );
});

test('producer assignments may span bands without creating duplicate memberships', () => {
  assert.doesNotThrow(() => assertOneBandPerPerformer([
    { type: 'member', participantId: 4, bandId: 1 },
    { type: 'producer', participantId: 4, bandId: 2 },
    { type: 'producer', participantId: 4, bandId: 3 },
  ]));

  assert.throws(
    () => assertOneBandPerPerformer([
      { type: 'member', participantId: 4, bandId: 1 },
      { type: 'member', participantId: 4, bandId: 2 },
    ]),
    /Participant 4 is assigned to multiple bands/,
  );
});

test('producer-only participants do not count toward performer band sizes', () => {
  const participants = [
    { id: 1, producerOnly: true },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ];

  const plan = createGenerationPlan(participants, []);

  assert.deepEqual(plan.producerOnlyParticipantIds, [1]);
  assert.deepEqual(plan.generatedBands.map((band) => band.members.map((member) => member.id)), [[2, 3, 4]]);
});

test('band sizes stay within the approved 3-to-6 performer range', () => {
  for (let total = 0; total <= 1000; total += 1) {
    const sizes = bandSizes(total);
    assert.ok(sizes.every((size) => size >= 3 && size <= 6));
    assert.equal(sizes.reduce((sum, size) => sum + size, 0), total < 3 ? 0 : total);
  }
});

test('seeded generation is repeatable and different seeds choose alternative arrangements', () => {
  const instruments = ['Guitarist', 'Bassist', 'Percussionist', 'Keys'];
  const performers = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    first_name: `Player${index + 1}`,
    last_name: 'Test',
    experience: ['Beginner', 'Intermediate', 'Advanced', 'Beginner'][index % 4],
    primary_instrument: instruments[index % instruments.length],
    primary_instruments: JSON.stringify([instruments[index % instruments.length]]),
    availability_mask: 0b1111111,
    status: 'eligible',
    checked_in: 1,
    raw_json: JSON.stringify({
      'Are you willing to be a humble listener and/or a patient mentor regardless if you are a veteran musician or have ZERO musical background? *':
        index % 2 ? 'I am new and will humbly learn' : 'I have experience that I would love to share with others!',
    }),
  }));
  const producers = Array.from({ length: 2 }, (_, index) => ({
    id: 21 + index,
    producerOnly: true,
    raw: {
      'Do you have mixing skills AND want to mix for this event?': 'Yes',
      'Performer + Producer, or Producer only?': 'Producer only',
      'If short on producers, open to producing for additional teams?': 'Absolutely!',
    },
  }));
  const participants = [...performers, ...producers];
  const options = { instrumentMappings: DEFAULT_INSTRUMENT_MAPPINGS };
  const firstRun = createGenerationPlan(participants, [], { ...options, seed: 'seed-one' });
  const repeatedRun = createGenerationPlan(participants, [], { ...options, seed: 'seed-one' });
  const alternateRun = createGenerationPlan(participants, [], { ...options, seed: 'seed-two' });
  const assignments = (plan) => plan.generatedBands.map((band) => band.members.map((member) => member.id));
  const firstAssignments = JSON.stringify(assignments(firstRun));
  const repeatedAssignments = JSON.stringify(assignments(repeatedRun));
  const alternateAssignments = JSON.stringify(assignments(alternateRun));

  assert.equal(firstAssignments, repeatedAssignments);
  assert.notEqual(firstAssignments, alternateAssignments);

  const scorer = createMatchingScorer(DEFAULT_INSTRUMENT_MAPPINGS);
  for (const plan of [firstRun, alternateRun]) {
    const assignedIds = assignments(plan).flat();
    assert.equal(new Set(assignedIds).size, performers.length);
    assert.deepEqual([...assignedIds].sort((left, right) => left - right), performers.map(({ id }) => id));
    assert.ok(plan.generatedBands.every((band) => band.members.length >= 3 && band.members.length <= 6));
    assert.ok(plan.generatedBands.every((band) => band.producers.length === 1));

    for (const band of plan.generatedBands) {
      const members = band.members.map(scorer.prepareParticipant);
      const coveredRoles = new Set(members.flatMap((member) => [...member.allRoles]));
      assert.ok(REQUIRED_ROLES.every((role) => coveredRoles.has(role)));
      assert.ok(members.every((member) => member.availability === 0b1111111));
    }

    const producerCounts = new Map();
    for (const band of plan.generatedBands) {
      for (const producer of band.producers) {
        producerCounts.set(producer.id, (producerCounts.get(producer.id) || 0) + 1);
      }
    }
    assert.ok([...producerCounts.values()].every((count) => count <= 3));
  }
});

test('generation returns a complete size-valid best-so-far plan at the time cap', () => {
  const participants = Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }));
  let clockCalls = 0;
  const plan = createGenerationPlan(participants, [], {
    seed: 'time-cap-seed',
    timeBudgetMs: 20_000,
    now: () => (clockCalls++ === 0 ? 0 : 10_001),
  });
  const assignedIds = plan.generatedBands.flatMap((band) => band.members.map((member) => member.id));

  assert.equal(plan.timedOut, true);
  assert.equal(new Set(assignedIds).size, participants.length);
  assert.deepEqual([...assignedIds].sort((left, right) => left - right), participants.map(({ id }) => id));
  assert.ok(plan.generatedBands.every((band) => band.members.length >= 3 && band.members.length <= 6));
});