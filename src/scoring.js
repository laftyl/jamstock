const MENTORSHIP_ANSWERS = {
  mentor: ['experience that i would love to share', 'experience to share'],
  learner: 'new and will humbly learn',
  notParticipating: 'not here to learn',
};

function mentorshipScore(answer) {
  const normalizedAnswer = String(answer ?? '').toLocaleLowerCase();

  if (MENTORSHIP_ANSWERS.mentor.some((answer) => normalizedAnswer.includes(answer))) {
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

module.exports = {
  compareParticipantsByRegistrationId,
  compareScoreVectors,
  mentorshipScore,
};