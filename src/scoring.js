const {
  availabilityBlockCount,
  availabilityMask,
  parseCheckboxValues,
  parsePrimaryInstruments,
  producerParticipation,
  readFormValue,
} = require('./parse');
const { resolveInstrumentRoles } = require('./instruments');

const REQUIRED_ROLES = ['percussion', 'bass', 'melody', 'rhythm'];
const ANY_GENRE = "i'm cool with any genre";
const MENTORSHIP_ANSWERS = {
  mentor: ['experience that i would love to share', 'experience to share'],
  learner: 'new and will humbly learn',
  notParticipating: 'not here to learn',
};

function readRawParticipant(participant) {
  if (participant.raw && typeof participant.raw === 'object') {
    return participant.raw;
  }

  try {
    return JSON.parse(participant.raw_json || '{}');
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    throw new Error(`Participant ${participant.id} has invalid saved form data.`, { cause: error });
  }
}

function mentorshipScore(answer) {
  const normalizedAnswer = String(answer ?? '').toLocaleLowerCase();

  if (MENTORSHIP_ANSWERS.mentor.some((answerOption) => normalizedAnswer.includes(answerOption))) {
    return 100;
  }

  if (normalizedAnswer.includes(MENTORSHIP_ANSWERS.learner)) {
    return 75;
  }

  if (normalizedAnswer.includes(MENTORSHIP_ANSWERS.notParticipating)) {
    return 0;
  }

  return 50;
}

function compareScoreVectors(left, right) {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function compareParticipantsByRegistrationId(left, right) {
  return Number(left.id) - Number(right.id);
}

function createMatchingScorer(mappingRows) {
  function prepareParticipant(participant) {
    const raw = readRawParticipant(participant);
    const instruments = parsePrimaryInstruments(
      participant.primary_instruments,
      participant.primary_instrument,
    );
    const instrumentRoles = resolveInstrumentRoles(instruments, mappingRows);
    const primaryRoles = new Set(instrumentRoles.flatMap((item) => item.primary_roles));
    const allRoles = new Set(instrumentRoles.flatMap((item) => item.roles));
    const mentorship = readFormValue(
      raw,
      'Are you willing to be a humble listener and/or patient mentor?',
      'Are you willing to be a humble listener and/or a patient mentor regardless if you are a veteran musician or have ZERO musical background?',
      'Are you willing to be a humble listener and/or a patient mentor regardless if you are a veteran musician or have ZERO musical background? *',
    );
    const production = producerParticipation(raw, participant.producerOverride);
    const equipmentAccess = parseCheckboxValues(readFormValue(
      raw,
      'What portable instruments (and supporting equipment) do you have access to?',
      'What portable instruments (and supporting equipment) do you have access to? (Check all that apply)',
    ));
    const equipmentShare = parseCheckboxValues(readFormValue(
      raw,
      'What equipment are you willing to share with your bandmates?',
      'What equipment, if any, are you willing to share with your bandmates for the duration of the event?',
      'What equipment, if any, are you willing to share with your bandmates for the duration of the event? *',
    )).filter((item) => !item.toLocaleLowerCase().includes('no equipment'));
    const genreAnswer = readFormValue(
      raw,
      'Are you open to playing genres outside of your normal playing style?',
      'Are you open to playing genres outside of your normal playing style? *',
    );
    const genres = new Set(parseCheckboxValues(
      participant.genres || readFormValue(raw, 'What genres are you most comfortable playing (Check all that apply)'),
    ).map(normalizeGenre));
    const availability = Number.isInteger(participant.availability_mask)
      ? participant.availability_mask
      : availabilityMask(participant.availability);
    const experience = String(participant.experience ?? '').toLocaleLowerCase();
    const mentorshipValue = mentorshipScore(mentorship);
    const producerOnly = Boolean(participant.producerOnly) || production.producerOnly;

    return {
      ...participant,
      raw,
      displayName: `${participant.first_name ?? ''} ${participant.last_name ?? ''}`.trim(),
      instruments,
      instrumentRoles,
      primaryRoles,
      allRoles,
      mentorship,
      mentorshipValue,
      mentor: mentorshipValue === 100,
      learner: mentorshipValue === 75,
      newer: experience.includes('beginner') || experience.includes('none'),
      experienced: experience.includes('intermediate') || experience.includes('advanced'),
      advanced: experience.includes('advanced'),
      availability,
      genres,
      genreFlexible: genreAnswer.toLocaleLowerCase().includes('absolutely'),
      genreSensitive: genreAnswer.toLocaleLowerCase().includes('prefer to stay'),
      equipmentAccess,
      equipmentShare,
      isProducer: production.isProducer,
      producerOnly,
      producerNeedsReview: production.needsReview,
      producerReviewReason: production.reviewReason,
      additionalTeamsOpen: production.additionalTeamsOpen,
      producerCapacity: production.capacity,
      hasVocals: instruments.some((instrument) => /vocal|singer/i.test(instrument)),
    };
  }

  function scoreBandPlacement(candidate, members, { producerAssigned = false, instrumentCounts = new Map() } = {}) {
    const group = [...members, candidate];
    const hasMentor = group.some((member) => member.mentor);
    const hasLearner = group.some((member) => member.learner);
    const mentorshipPenalty = hasMentor && hasLearner ? 0 : hasMentor || hasLearner ? 1 : 2;
    const sharedAvailability = sharedAvailabilityMask(group);
    const pairwiseLowAvailabilityPairs = countPairwiseLowAvailabilityPairs(group);
    const experiencePenalty = Number(!group.some((member) => member.newer))
      + Number(!group.some((member) => member.experienced))
      + Number(!group.some((member) => member.advanced));
    const coveredRoles = new Set(group.flatMap((member) => [...member.allRoles]));
    const missingRoles = REQUIRED_ROLES.filter((role) => !coveredRoles.has(role)).length;
    const secondaryRoleFallbacks = REQUIRED_ROLES.filter((role) =>
      coveredRoles.has(role) && !group.some((member) => member.primaryRoles.has(role))).length;
    const rarePrimaryInstrumentBenefit = candidate.instrumentRoles.reduce((benefit, instrument) => {
      const addsPrimaryRole = instrument.primary_roles.some((role) =>
        REQUIRED_ROLES.includes(role) && !members.some((member) => member.primaryRoles.has(role)));
      if (!addsPrimaryRole) {
        return benefit;
      }

      const count = instrumentCounts.get(instrument.instrument.toLocaleLowerCase()) ?? 1;
      return benefit + 1 / count;
    }, 0);
    const equipmentGapCount = findEquipmentGaps(group).length;
    const genreMismatchCount = countGenreMismatches(group);

    return [
      mentorshipPenalty * 2 + Number(!producerAssigned),
      (7 - availabilityBlockCount(sharedAvailability)) * 100 + pairwiseLowAvailabilityPairs,
      experiencePenalty,
      missingRoles * 100 + secondaryRoleFallbacks * 10 - rarePrimaryInstrumentBenefit,
      equipmentGapCount,
      genreMismatchCount,
    ];
  }

  return { prepareParticipant, scoreBandPlacement };
}

function sharedAvailabilityMask(members) {
  return members.reduce((mask, member) => mask & member.availability, 0b1111111);
}

function countPairwiseLowAvailabilityPairs(members) {
  let lowOverlapPairs = 0;

  for (let leftIndex = 0; leftIndex < members.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < members.length; rightIndex += 1) {
      const sharedBlocks = availabilityBlockCount(members[leftIndex].availability & members[rightIndex].availability);
      lowOverlapPairs += Number(sharedBlocks < 5);
    }
  }

  return lowOverlapPairs;
}

function createInstrumentTally(profiles) {
  const instrumentCounts = new Map();

  for (const profile of profiles) {
    for (const instrument of profile.instruments) {
      const normalizedInstrument = instrument.toLocaleLowerCase();
      instrumentCounts.set(normalizedInstrument, (instrumentCounts.get(normalizedInstrument) ?? 0) + 1);
    }
  }

  return instrumentCounts;
}

function normalizeGenre(genre) {
  return String(genre).trim().toLocaleLowerCase();
}

function countGenreMismatches(members) {
  const allGenres = new Set(members.flatMap((member) => [...member.genres]));
  const hasOpenGenre = allGenres.has(ANY_GENRE);

  if (hasOpenGenre) {
    return 0;
  }

  return members.filter((member) => {
    if (member.genreFlexible || !member.genreSensitive || member.genres.size === 0) {
      return false;
    }

    return ![...member.genres].some((genre) => allGenres.has(genre));
  }).length;
}

function equipmentCategory(value) {
  const normalized = String(value).toLocaleLowerCase();
  if (/guitar/.test(normalized)) return 'guitar';
  if (/bass/.test(normalized)) return 'bass';
  if (/percussion|drum/.test(normalized)) return 'percussion';
  if (/keys|keyboard|piano/.test(normalized)) return 'keys';
  if (/vocal|singer|microphone|\bmic\b/.test(normalized)) return 'microphone';
  if (/electronic|midi|synth|laptop|vst/.test(normalized)) return 'electronic';
  return normalized.replace(/\s+/g, ' ').trim();
}

function findEquipmentGaps(members) {
  const gaps = [];

  for (const member of members) {
    for (const instrument of member.instruments) {
      const neededCategory = equipmentCategory(instrument);
      const hasOwnEquipment = member.equipmentAccess.some((item) => equipmentCategory(item) === neededCategory);
      const sharedByBandmate = members.some((otherMember) => otherMember.id !== member.id
        && otherMember.equipmentShare.some((item) => equipmentCategory(item) === neededCategory));

      if (!hasOwnEquipment && !sharedByBandmate) {
        gaps.push({ participantId: member.id, participantName: member.displayName, item: instrument });
      }
    }
  }

  return gaps;
}

function createBandFlags(band, scorer, { bandId = band.id, bandName = band.name } = {}) {
  const members = band.members.map((member) => scorer.prepareParticipant(member));
  const producers = (band.producers || []).map((producer) => scorer.prepareParticipant(producer));
  const flags = [];
  const entity = { type: 'band', id: bandId, name: bandName };
  const addFlag = (severity, code, priorityRank, title, message, metric, idSuffix = '') => {
    flags.push({
      id: `${code}:${entity.type}:${entity.id}${idSuffix ? `:${idSuffix}` : ''}`,
      severity,
      code,
      entity,
      bandId,
      priorityRank,
      title,
      message,
      ...(metric ? { metric } : {}),
      remedyIds: [],
    });
  };

  if (members.length < 3 || members.length > 6) {
    addFlag('BLOCKER', 'BAND_SIZE_OUT_OF_RANGE', 1, 'Band size outside 3 to 6',
      `This band has ${members.length} performers; the allowed range is 3–6.`,
      { current: members.length, target: '3–6', unit: 'performers' });
  }

  for (const role of REQUIRED_ROLES) {
    if (!members.some((member) => member.allRoles.has(role))) {
      addFlag('BLOCKER', `MISSING_ROLE_${role.toLocaleUpperCase()}`, 4,
        `Missing ${role} coverage`, `No band member can cover the ${role} role.`,
        { current: 0, target: 1, unit: 'members' });
    }
  }

  if (members.some((member) => member.instrumentRoles.some((instrument) =>
    instrument.roles.includes('manual review')))) {
    addFlag('WARNING', 'INSTRUMENT_MAPPING_REVIEW', 4, 'Instrument mapping needs review',
      'At least one instrument is not mapped to a matching role.');
  }

  if (producers.length !== 1) {
    addFlag('BLOCKER', 'PRODUCER_ASSIGNMENT_INVALID', 1, 'Producer assignment needs review',
      `This band has ${producers.length} assigned producers; exactly one is required.`,
      { current: producers.length, target: 1, unit: 'producers' });
  }

  const sharedBlocks = availabilityBlockCount(sharedAvailabilityMask(members));
  if (sharedBlocks < 5) {
    addFlag('WARNING', 'SHARED_AVAILABILITY_BELOW_TARGET', 2, 'Limited shared availability',
      `All members share ${sharedBlocks} of 7 availability blocks; 5 are preferred.`,
      { current: sharedBlocks, target: 5, unit: 'blocks' });
  }

  const hasNewer = members.some((member) => member.newer);
  const hasExperienced = members.some((member) => member.experienced);
  const hasAdvanced = members.some((member) => member.advanced);
  if (!hasNewer || !hasExperienced || !hasAdvanced) {
    addFlag('WARNING', 'EXPERIENCE_MIX', 3, 'Experience mix needs review',
      'This band does not include both newer and experienced members, including an Advanced member where possible.');
  }

  if (!members.some((member) => member.hasVocals)) {
    addFlag('WARNING', 'VOCALS_NOT_COVERED', 4, 'No vocal coverage',
      'Vocal coverage is preferred but optional.');
  }

  findEquipmentGaps(members).forEach((gap, index) => {
    addFlag('WARNING', 'EQUIPMENT_GAP', 5, 'Equipment access needs review',
      `${gap.participantName || `Participant ${gap.participantId}`} has no listed access or willing in-band share for ${gap.item}.`,
      undefined, `${gap.participantId}:${index}`);
  });

  if (countGenreMismatches(members)) {
    addFlag('INFO', 'GENRE_PREFERENCE_MISMATCH', 6, 'Genre preference mismatch',
      'At least one genre-sensitive member has no preferred genre in common with this band.');
  }

  return flags;
}

function createUnassignedFlags(participants) {
  return participants.map((participant) => {
    const name = `${participant.first_name ?? ''} ${participant.last_name ?? ''}`.trim()
      || `Participant ${participant.id}`;
    return {
      id: `UNASSIGNED_PERFORMER:participant:${participant.id}`,
      severity: 'BLOCKER',
      code: 'UNASSIGNED_PERFORMER',
      entity: { type: 'participant', id: participant.id, name },
      participantId: participant.id,
      priorityRank: 1,
      title: 'Performer not assigned',
      message: `${name} could not be placed because fewer than three performers remained for another band.`,
      remedyIds: [],
    };
  });
}

function createProducerCapacityStatus(producerName, assignedBandCount, maximumCapacity) {
  const remainingCapacity = maximumCapacity - assignedBandCount;
  const overCapacityCount = Math.max(0, -remainingCapacity);

  return {
    assignedBandCount,
    maximumCapacity,
    remainingCapacity: Math.max(0, remainingCapacity),
    overCapacityCount,
    state: overCapacityCount
      ? 'over-capacity'
      : remainingCapacity === 0
        ? 'at-capacity'
        : remainingCapacity === 1
          ? 'one-remaining'
          : 'available',
    firstComeFirstServeNotice: assignedBandCount > 3
      ? `${producerName} is responsible for ${assignedBandCount} songs, which is more than 3. Announce: "first come first serve basis."`
      : '',
  };
}

module.exports = {
  REQUIRED_ROLES,
  compareParticipantsByRegistrationId,
  compareScoreVectors,
  createBandFlags,
  createInstrumentTally,
  createMatchingScorer,
  createProducerCapacityStatus,
  createUnassignedFlags,
  mentorshipScore,
};