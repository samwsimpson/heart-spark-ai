export function getBaseURL() {
  // same-host dev proxy
  return typeof window === 'undefined' ? '' : '';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
  // let any component (like Nav) know the auth state changed
  window.dispatchEvent(new Event('token-updated'));
}

export async function api(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && opts.body) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${getBaseURL()}${path}`, { ...opts, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.detail || j.message || msg; } catch {}
    throw new Error(msg);
  }
  // some endpoints have no body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
