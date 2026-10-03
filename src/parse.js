const AVAILABILITY_BLOCKS = [
  ['friday evening', 'fri evening'],
  ['saturday morning', 'sat morning'],
  ['saturday afternoon', 'sat afternoon'],
  ['saturday evening', 'sat evening'],
  ['sunday morning', 'sun morning'],
  ['sunday afternoon', 'sun afternoon'],
  ['sunday evening', 'sun evening'],
];

function parseCheckboxValues(value) {
  const values = Array.isArray(value) ? value : String(value ?? '').split(/[,;\n]/);
  const seen = new Set();
  const parsedValues = [];

  for (const valuePart of values) {
    const label = String(valuePart).trim();
    const normalizedLabel = label.toLocaleLowerCase();

    if (label && !seen.has(normalizedLabel)) {
      seen.add(normalizedLabel);
      parsedValues.push(label);
    }
  }

  return parsedValues;
}

function availabilityMask(value) {
  const selectedBlocks = new Set(
    parseCheckboxValues(value).map((block) => block.toLocaleLowerCase().replace(/\s+/g, ' ')),
  );
  let mask = 0;

  for (let index = 0; index < AVAILABILITY_BLOCKS.length; index += 1) {
    if (AVAILABILITY_BLOCKS[index].some((label) => selectedBlocks.has(label))) {
      mask |= 1 << index;
    }
  }

  return mask;
}

function availabilityBlockCount(mask) {
  let remaining = mask >>> 0;
  let count = 0;

  while (remaining > 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }

  return count;
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function readFormValue(row, ...names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }

  return '';
}

function classifyParticipant(row) {
  const firstName = readFormValue(row, 'First name');
  const lastName = readFormValue(row, 'Last name');
  const email = normalizeEmail(readFormValue(row, 'Email'));
  const ticket = readFormValue(row, 'Have you purchased your event ticket?');
  const age = readFormValue(row, 'Are you 21 or older?');
  const transport = readFormValue(
    row,
    'Do you have reliable transportation to meet the required in-person portions of the event?',
    'Do you have reliable transportation to meet the required in-person portions of the event? *',
    'Reliable transportation to required in-person portions?',
  );
  const commitment = readFormValue(
    row,
    'Are you committed to being a reliable bandmate for the full 48 hours of this event?',
    'Committed to being a reliable bandmate for the full 48 hours?',
  );
  const primaryInstruments = parseCheckboxValues(readFormValue(
    row,
    'What is your primary instrument? (Check all that apply)',
    'What is your primary instrument? (check all that apply)',
  ));
  const otherInstruments = parseCheckboxValues(readFormValue(
    row,
    'What other instruments can you play? (Check all that apply)',
    'What other instruments can you play? (check all that apply)',
  ));
  const availability = readFormValue(
    row,
    'What hours are you free during the 48-hour event? (Check all that apply)',
    'What hours are you free during the 48-hour event? (check all that apply)',
  );
  const status = !firstName || !lastName || !email
    ? 'invalid'
    : ticket !== 'Yes' || age === 'No' || transport === 'No' || commitment.startsWith('I cannot')
      ? 'excluded'
      : 'eligible';

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    experience: readFormValue(row, 'How much music experience do you have?'),
    primary_instrument: primaryInstruments.join(', '),
    primary_instruments: primaryInstruments,
    other_instruments: otherInstruments.join(', '),
    skills: parseCheckboxValues(readFormValue(row, 'What musical skills do you have? (Check all that apply)')).join(', '),
    genres: parseCheckboxValues(readFormValue(row, 'What genres are you most comfortable playing (Check all that apply)')).join(', '),
    availability,
    availability_mask: availabilityMask(availability),
    status,
    raw_json: JSON.stringify(row),
    issue: status === 'eligible' ? '' : status === 'excluded' ? 'Eligibility rule' : 'Missing required field',
  };
}

function isProducerOnly(rawRow) {
  const producerAnswer = readFormValue(rawRow, 'Do you have mixing skills AND want to mix for this event?');
  const roleAnswer = readFormValue(rawRow, 'Performer + Producer, or Producer only?');
  return producerAnswer === 'Yes' && roleAnswer.toLocaleLowerCase() === 'producer only';
}

function parsePrimaryInstruments(storedValue, legacyValue = '') {
  if (Array.isArray(storedValue)) {
    return parseCheckboxValues(storedValue);
  }

  if (storedValue) {
    try {
      const parsedValue = JSON.parse(storedValue);
      if (Array.isArray(parsedValue)) {
        return parseCheckboxValues(parsedValue);
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
    }
  }

  return parseCheckboxValues(legacyValue || storedValue || '');
}

module.exports = {
  AVAILABILITY_BLOCKS,
  availabilityBlockCount,
  availabilityMask,
  classifyParticipant,
  isProducerOnly,
  normalizeEmail,
  parseCheckboxValues,
  parsePrimaryInstruments,
  readFormValue,
};