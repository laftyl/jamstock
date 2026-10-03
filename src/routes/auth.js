const express = require('express');
const { requireAuth } = require('../auth');

function createAuthRouter(authService) {
  const router = express.Router();

  router.get('/status', (request, response) => {
    response.json({ configured: authService.configured() });
  });

  router.post('/setup', (request, response) => {
    const { password, answers } = request.body;
    if (authService.configured()) {
      return response.status(409).json({ error: 'Administrator is already configured.' });
    }

    if (!validPassword(password)) {
      return response.status(400).json({ error: 'Password must be at least 10 characters.' });
    }
    if (!validRecoveryAnswers(answers)) {
      return response.status(400).json({ error: 'Answer all three recovery questions.' });
    }

    response.json({ token: authService.setup(password, answers) });
  });

  router.post('/login', (request, response) => {
    const token = authService.login(String(request.body.password ?? ''));
    if (!token) {
      return response.status(401).json({ error: 'Incorrect password.' });
    }

    response.json({ token });
  });

  router.post('/reset', (request, response) => {
    const { password, answers } = request.body;
    if (!validPassword(password)) {
      return response.status(400).json({ error: 'Password must be at least 10 characters.' });
    }
    if (!validRecoveryAnswers(answers)) {
      return response.status(400).json({ error: 'Answer all three recovery questions.' });
    }

    const token = authService.reset(password, answers);
    if (!token) {
      return response.status(401).json({ error: 'The recovery answers did not match.' });
    }

    response.json({ token });
  });

  router.post('/change-password', requireAuth(authService), (request, response) => {
    const { currentPassword, newPassword } = request.body;
    if (!validPassword(newPassword)) {
      return response.status(400).json({ error: 'New password must be at least 10 characters.' });
    }
    if (typeof currentPassword !== 'string' || !authService.changePassword(currentPassword, newPassword)) {
      return response.status(401).json({ error: 'Current password is incorrect.' });
    }

    response.json({ ok: true });
  });

  router.post('/logout', requireAuth(authService), (request, response) => {
    authService.logout(request.sessionToken);
    response.json({ ok: true });
  });

  return router;
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 10;
}

function validRecoveryAnswers(answers) {
  return Array.isArray(answers)
    && answers.length === 3
    && answers.every((answer) => typeof answer === 'string' && answer.trim());
}

module.exports = { createAuthRouter };