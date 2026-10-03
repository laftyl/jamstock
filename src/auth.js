const crypto = require('node:crypto');
const { normalizeEmail } = require('./parse');

function hash(value, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(value, salt, 64).toString('hex')}`;
}

function verify(value, storedValue) {
  if (!storedValue || !storedValue.includes(':')) {
    return false;
  }

  const [salt, digest] = storedValue.split(':');
  const expected = Buffer.from(digest, 'hex');
  const candidate = Buffer.from(crypto.scryptSync(value, salt, 64).toString('hex'), 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function normalizeAnswer(value) {
  return normalizeEmail(value);
}

function sessionTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createAuthService(settingsRepository, sessionRepository) {
  function createSession() {
    const token = crypto.randomBytes(32).toString('hex');
    sessionRepository.create(sessionTokenHash(token));
    return token;
  }

  return {
    configured() {
      return Boolean(settingsRepository.get('password_hash'));
    },
    setup(password, answers) {
      settingsRepository.saveMany([
        ['password_hash', hash(password)],
        ['answer_1', hash(normalizeAnswer(answers[0]))],
        ['answer_2', hash(normalizeAnswer(answers[1]))],
        ['answer_3', hash(normalizeAnswer(answers[2]))],
      ]);
      return createSession();
    },
    login(password) {
      const storedPassword = settingsRepository.get('password_hash');
      if (!verify(password, storedPassword)) {
        return null;
      }

      return createSession();
    },
    reset(password, answers) {
      if (!this.configured()) {
        return null;
      }

      const answersMatch = answers.every((answer, index) =>
        verify(normalizeAnswer(answer), settingsRepository.get(`answer_${index + 1}`)));
      if (!answersMatch) {
        return null;
      }

      settingsRepository.set('password_hash', hash(password));
      return createSession();
    },
    changePassword(currentPassword, newPassword) {
      const storedPassword = settingsRepository.get('password_hash');
      if (typeof newPassword !== 'string' || newPassword.length < 10
        || !verify(currentPassword, storedPassword)) {
        return false;
      }

      settingsRepository.set('password_hash', hash(newPassword));
      return true;
    },
    isSessionValid(token) {
      return Boolean(token && sessionRepository.exists(sessionTokenHash(token)));
    },
    logout(token) {
      if (token) {
        sessionRepository.remove(sessionTokenHash(token));
      }
    },
  };
}

function getRequestToken(request) {
  const authorization = request.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7);
  }

  return authorization || request.query.token || '';
}

function requireAuth(authService) {
  return function checkAuthentication(request, response, next) {
    const token = getRequestToken(request);
    if (!authService.isSessionValid(token)) {
      return response.status(401).json({ error: 'Authentication required' });
    }

    request.sessionToken = token;
    next();
  };
}

module.exports = {
  createAuthService,
  getRequestToken,
  hash,
  normalizeAnswer,
  requireAuth,
  sessionTokenHash,
  verify,
};