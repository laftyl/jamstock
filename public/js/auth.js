export function showAuth(state, mode) {
  state.mode = mode;
  document.querySelector('#auth-view').hidden = false;
  document.querySelector('#dashboard-view').hidden = true;
  document.querySelector('#auth-form').hidden = false;

  const setup = mode === 'setup';
  const reset = mode === 'reset';
  document.querySelector('#security-fields').hidden = !(setup || reset);
  document.querySelector('#reset-button').hidden = setup || reset;
  document.querySelector('#password-label').textContent = setup || reset
    ? 'Create administrator password'
    : 'Administrator password';
  document.querySelector('#auth-form button[type="submit"]').textContent = setup
    ? 'Create password'
    : reset
      ? 'Reset password'
      : 'Unlock workspace';
  document.querySelector('#security-heading').textContent = setup
    ? 'Save these answers for password recovery. They are not used to log in.'
    : 'Answer all three questions to reset your password.';
  document.querySelector('#password-input').value = '';
  document.querySelector('#auth-copy').textContent = setup
    ? 'Create the local password used to protect this workspace.'
    : reset
      ? 'Answer your recovery questions to create a new local password.'
      : 'Unlock the local workspace to continue.';
  document.querySelector('#auth-error').textContent = '';

  if (!setup && !reset) {
    for (const selector of ['#question-one', '#question-two', '#question-three']) {
      document.querySelector(selector).value = '';
    }
  }
}

export function bindAuthEvents(state, request, showDashboard) {
  document.querySelector('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('#auth-error').textContent = '';

    const endpoint = state.mode === 'setup'
      ? '/api/auth/setup'
      : state.mode === 'reset'
        ? '/api/auth/reset'
        : '/api/auth/login';
    const payload = { password: document.querySelector('#password-input').value };

    if (state.mode === 'setup' || state.mode === 'reset') {
      payload.answers = [
        document.querySelector('#question-one').value,
        document.querySelector('#question-two').value,
        document.querySelector('#question-three').value,
      ];
    }

    try {
      const result = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (state.mode === 'setup') {
        localStorage.removeItem('jamstock_session');
        showAuth(state, 'login');
        document.querySelector('#auth-copy').textContent = 'Password created. Log in to begin importing your spreadsheet.';
        return;
      }

      localStorage.setItem('jamstock_session', result.token);
      showDashboard(state.mode === 'login' ? 'imports-panel' : 'overview-panel');
    } catch (error) {
      document.querySelector('#auth-error').textContent = error.message;
    }
  });

  document.querySelector('#logout-button').addEventListener('click', async () => {
    await request('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('jamstock_session');
    state.authenticated = false;
    showAuth(state, 'login');
  });

  document.querySelector('#reset-button').addEventListener('click', () => showAuth(state, 'reset'));

  const passwordDialog = document.querySelector('#password-dialog');
  document.querySelector('#change-password-button').addEventListener('click', () => {
    document.querySelector('#change-password-error').textContent = '';
    passwordDialog.showModal();
  });
  document.querySelector('#cancel-password-change').addEventListener('click', () => passwordDialog.close());
  document.querySelector('#change-password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorElement = document.querySelector('#change-password-error');
    errorElement.textContent = '';

    try {
      await request('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: document.querySelector('#current-password-input').value,
          newPassword: document.querySelector('#new-password-input').value,
        }),
      });
      document.querySelector('#change-password-form').reset();
      passwordDialog.close();
      const notice = document.querySelector('#notice');
      notice.hidden = false;
      notice.textContent = 'Password updated.';
    } catch (error) {
      errorElement.textContent = error.message;
    }
  });
}