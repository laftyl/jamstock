const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertOneBandPerPerformer,
  bandSizes,
  createGenerationPlan,
} = require('../src/matching');

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
  const participants = Array.from({ length: 25 }, (_, index) => ({ id: index + 1 }));
  const firstRun = createGenerationPlan(participants, [], { seed: 'seed-one' });
  const repeatedRun = createGenerationPlan(participants, [], { seed: 'seed-one' });
  const alternateRun = createGenerationPlan(participants, [], { seed: 'seed-two' });
  const assignments = (plan) => plan.generatedBands.map((band) => band.members.map((member) => member.id));

  assert.deepEqual(assignments(firstRun), assignments(repeatedRun));
  assert.notDeepEqual(assignments(firstRun), assignments(alternateRun));

  for (const plan of [firstRun, alternateRun]) {
    const assignedIds = assignments(plan).flat();
    assert.equal(new Set(assignedIds).size, participants.length);
    assert.deepEqual([...assignedIds].sort((left, right) => left - right), participants.map(({ id }) => id));
    assert.ok(plan.generatedBands.every((band) => band.members.length >= 3 && band.members.length <= 6));
  }
});