const { mentorshipScore } = require('./scoring');
const { isProducerOnly, parsePrimaryInstruments, readFormValue } = require('./parse');

function readRawParticipant(participant) {
  try {
    return JSON.parse(participant.raw_json || '{}');
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    return {};
  }
}

function displayParticipant(participant) {
  const raw = readRawParticipant(participant);
  const mentorship = readFormValue(
    raw,
    'Are you willing to be a humble listener and/or patient mentor?',
    'Are you willing to be a humble listener and/or a patient mentor regardless if you are a veteran musician or have ZERO musical background?',
  );
  const primaryInstruments = parsePrimaryInstruments(
    participant.primary_instruments,
    participant.primary_instrument,
  );

  return {
    ...participant,
    primary_instruments: primaryInstruments,
    mentorship,
    mentorship_score: mentorshipScore(mentorship),
    instruments: primaryInstruments.join(', ') || 'Needs review',
    secondary_instruments: participant.other_instruments || 'None listed',
  };
}

function producerOnly(participant) {
  return isProducerOnly(readRawParticipant(participant));
}

module.exports = {
  displayParticipant,
  producerOnly,
  readRawParticipant,
};