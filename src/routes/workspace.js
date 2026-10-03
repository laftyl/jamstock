const express = require('express');
const { requireAuth } = require('../auth');

function createWorkspaceRouter(authService, workspaceRepository) {
  const router = express.Router();
  router.use(requireAuth(authService));

  router.post('/reset', (request, response) => {
    workspaceRepository.reset();
    response.json({ ok: true });
  });

  return router;
}

module.exports = { createWorkspaceRouter };