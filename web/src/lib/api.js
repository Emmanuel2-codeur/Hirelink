import { supabase } from './supabase';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (session) headers.Authorization = `Bearer ${session.access_token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Erreur ${res.status}`);
  return json;
}
export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  put: (p, b) => request(p, { method: 'PUT', body: b }),
};
