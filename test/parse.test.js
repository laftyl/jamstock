const assert = require('node:assert/strict');
const test = require('node:test');

const {
  availabilityBlockCount,
  availabilityMask,
  classifyParticipant,
  parseCheckboxValues,
  parsePrimaryInstruments,
  producerParticipation,
} = require('../src/parse');
const { resolveInstrumentRoles } = require('../src/instruments');
const { compareScoreVectors, mentorshipScore } = require('../src/scoring');

test('checkbox parsing trims values, removes blanks, and preserves distinct labels', () => {
  assert.deepEqual(parseCheckboxValues(' Guitarist, Bassist, , guitarist '), ['Guitarist', 'Bassist']);
});

test('availability maps the seven form blocks to a bitmask', () => {
  const mask = availabilityMask('Friday evening, Saturday afternoon, Sunday evening');

  assert.equal(mask, 1 | 4 | 64);
  assert.equal(availabilityBlockCount(mask), 3);
});

test('classification exposes every selected primary instrument as an array', () => {
  const row = classifyParticipant({
    'First name': 'Jo',
    'Last name': 'Player',
    Email: ' JO@example.com ',
    'Have you purchased your event ticket?': 'Yes',
    'Are you 21 or older?': 'Yes',
    'Do you have reliable transportation to meet the required in-person portions of the event?': 'Yes',
    'Are you committed to being a reliable bandmate for the full 48 hours of this event?': 'Yes',
    'What is your primary instrument? (Check all that apply)': 'Guitarist, Bassist, Keys',
    'What hours are you free during the 48-hour event? (Check all that apply)': 'Friday evening, Sunday afternoon',
  });

  assert.equal(row.status, 'eligible');
  assert.equal(row.email, 'jo@example.com');
  assert.deepEqual(row.primary_instruments, ['Guitarist', 'Bassist', 'Keys']);
  assert.equal(row.availability_mask, 33);
});

test('legacy comma-separated instruments remain readable during migration', () => {
  assert.deepEqual(parsePrimaryInstruments('', 'Guitarist, Bassist'), ['Guitarist', 'Bassist']);
});

test('role mappings resolve approved instruments and flag unknown instruments', () => {
  assert.deepEqual(resolveInstrumentRoles(['Bassist', 'Unknown thing']).map((item) => item.roles), [
    ['bass', 'rhythm', 'melody'],
    ['manual review'],
  ]);
});

test('producer role detection accepts current and legacy Google Forms fields', () => {
  assert.deepEqual(producerParticipation({
    'Do you have skills in mixing music AND do you want to mix music for this event?': 'Yes',
    'Would you like to be both a performer and producer, or focus primarily on production?': 'performer and producer',
    'If this event is short on producers, would you be open to producing for additional teams?': 'Absolutely!',
  }), {
    isProducer: true,
    producerOnly: false,
    additionalTeamsOpen: true,
    capacity: 2,
    needsReview: false,
    reviewReason: '',
  });
  assert.deepEqual(producerParticipation({
    'Do you have mixing skills AND want to mix for this event?': 'Yes',
    'Performer + Producer, or Producer only?': 'Producer only',
    'If short on producers, open to producing for additional teams?': "No, I'd rather focus on my team",
  }), {
    isProducer: true,
    producerOnly: true,
    additionalTeamsOpen: false,
    capacity: 1,
    needsReview: false,
    reviewReason: '',
  });
  assert.deepEqual(producerParticipation({
    'Do you have skills in mixing music AND do you want to mix music for this event?': 'No',
    'Would you like to be both a performer and producer, or focus primarily on production?': 'performer',
    'If this event is short on producers, would you be open to producing for additional teams?': 'Absolutely!',
  }), {
    isProducer: false,
    producerOnly: false,
    additionalTeamsOpen: false,
    capacity: 0,
    needsReview: false,
    reviewReason: '',
  });
  assert.equal(producerParticipation({
    'Do you have mixing skills AND want to mix for this event?': 'Yes',
    'Performer + Producer, or Producer only?': 'Producer only',
  }).needsReview, true);
});

test('shared scoring helpers keep mentorship values and lexicographic ordering stable', () => {
  assert.equal(mentorshipScore('I have experience that I would love to share'), 100);
  assert.ok(compareScoreVectors([0, 1, 0], [0, 0, 100]) > 0);
});