const { createBandRepository } = require('./bands');
const { createInstrumentRepository } = require('./instruments');
const { createParticipantRepository } = require('./participants');
const { createSessionRepository } = require('./sessions');
const { createSettingsRepository } = require('./settings');
const { createWorkspaceRepository } = require('./workspace');

function createRepositories(db) {
  return {
    bands: createBandRepository(db),
    instruments: createInstrumentRepository(db),
    participants: createParticipantRepository(db),
    sessions: createSessionRepository(db),
    settings: createSettingsRepository(db),
    workspace: createWorkspaceRepository(db),
  };
}

module.exports = { createRepositories };