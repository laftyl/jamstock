export function bindImportEvents(request, loadDashboard) {
  document.querySelector('#import-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', document.querySelector('#import-file').files[0]);

    try {
      const result = await request('/api/import/preview', { method: 'POST', body: formData });
      document.querySelector('#import-result').innerHTML = `<p class="status">${result.valid} eligible · ${result.excluded} excluded · ${result.invalid} needing review · ${result.duplicates} duplicate emails removed</p><button id="commit-import" class="button button-primary">Save eligible rows</button>`;
      document.querySelector('#commit-import').addEventListener('click', async () => {
        const saved = await request('/api/import/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.rows),
        });
        showNotice(`${saved.inserted} rows saved; ${saved.duplicates} duplicate emails skipped.`);
        await loadDashboard();
      });
    } catch (error) {
      document.querySelector('#import-result').textContent = error.message;
    }
  });

  document.querySelector('#reset-all-button').addEventListener('click', async () => {
    if (!window.confirm('This deletes every imported participant and band so you can test from scratch. This cannot be undone. Continue?')) {
      return;
    }

    try {
      await request('/api/reset', { method: 'POST' });
      showNotice('Workspace reset. Import a spreadsheet to begin again.');
      await loadDashboard();
    } catch (error) {
      showNotice(error.message);
    }
  });
}

function showNotice(message) {
  const notice = document.querySelector('#notice');
  notice.hidden = false;
  notice.textContent = message;
}