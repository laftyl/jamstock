export async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('jamstock_session');

  if (token) {
    headers.set('Authorization', token);
  }

  const response = await fetch(url, { ...options, headers, cache: 'no-store' });
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`The local JamStock server returned an unexpected page for ${url} (HTTP ${response.status}). Restart it with Start.command, then use http://127.0.0.1:3000.`);
  }

  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}