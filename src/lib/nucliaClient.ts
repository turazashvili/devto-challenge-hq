'use client';

type RagSettings = {
  apiKey: string;
  knowledgebox: string;
  zone: string;
  account: string;
  kbslug: string;
  backend: string;
  cdn: string;
};

const RAG_STORAGE_KEY = 'nuclia-settings';

export function getRagSettings(): RagSettings {
  const def = {
    apiKey: '',
    knowledgebox: '',
    zone: '',
    account: '',
    kbslug: '',
    backend: 'https://rag.progress.cloud/api',
    cdn: 'https://cdn.rag.progress.cloud/'
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(RAG_STORAGE_KEY) || '{}');
    const merged = { ...def, ...parsed } as RagSettings;
    // Debug (mask api key)
    try {
      console.log('[Nuclia] Loaded RAG settings:', { ...merged, apiKey: merged.apiKey ? '***' : '' });
    } catch {}
    return merged;
  } catch {
    return def as RagSettings;
  }
}

function getSettingsOrThrow() {
  const s = getRagSettings();
  if (!s.apiKey || !s.knowledgebox || !s.zone) {
    throw new Error('Nuclia settings missing. Open RAG Settings and fill API key, Zone, Knowledge Box.');
  }
  return s;
}

function buildZoneBackend(base: string, zone: string): string {
  try {
    const u = new URL(base);
    const zoneHost = `${zone}.${u.host}`;
    return `${u.protocol}//${zoneHost}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return base.replace(/\/$/, '');
  }
}

async function apiFetch(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<unknown> {
  const s = getSettingsOrThrow();
  const base = buildZoneBackend(s.backend, s.zone);
  const url = `${base}/v1/kb/${encodeURIComponent(s.knowledgebox)}${path}`;
  const headers: Record<string, string> = {
    'X-NUCLIA-SERVICEACCOUNT': `Bearer ${s.apiKey}`,
    'Content-Type': 'application/json'
  };
  try { console.log('[Nuclia] request', { method, url, body }); } catch {}
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => '');
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  const debugPayload: unknown = json === null ? text : json;
  try { console.log('[Nuclia] response', { status: res.status, ok: res.ok, url, json: debugPayload }); } catch {}
  if (!res.ok) {
    const err = new Error(`Nuclia API ${method} ${path} failed: ${res.status}`);
    const errorPayload = json === null ? text : json;
    console.error(err, errorPayload);
    throw err;
  }
  return json;
}

export async function upsertResourceClient(opts: {
  id: string;
  title: string;
  markdown: string;
  labels?: string[];
  links?: Record<string, { uri: string }>;
}) {
  // Route all uploads via server proxy to avoid CORS and ensure correct auth headers
  try { console.log('[Nuclia] upsertResource start', opts.id, opts.title); } catch {}
  const s = getRagSettings();
  try {
    const res = await fetch('/api/nuclia/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        knowledgebox: s.knowledgebox,
        zone: s.zone,
        backend: s.backend,
        contentType: 'text/MARKDOWN',
        data: opts.markdown,
        apiKey: s.apiKey,
      })
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (!res.ok) {
      console.error('[Nuclia] proxy upload failed', res.status, json ?? {});
      throw new Error('Proxy upload failed');
    }
    try { console.log('[Nuclia] upsertResource success (proxy)', opts.id, json); } catch {}
  } catch (err) {
    console.error('[Nuclia] upsert via proxy error', err);
    throw err;
  }
}

export async function deleteResourceClient(id: string) {
  try { console.log('[Nuclia] deleteResource start', id); } catch {}
  await apiFetch('DELETE', `/resources/${encodeURIComponent(id)}`);
  try { console.log('[Nuclia] deleteResource success', id); } catch {}
}

export async function uploadFileClient(rid: string, file: File) {
  try { console.log('[Nuclia] uploadFile start', rid, file?.name, file?.type, file?.size); } catch {}
  const s = getSettingsOrThrow();
  const base = buildZoneBackend(s.backend, s.zone);
  const url = `${base}/v1/kb/${encodeURIComponent(s.knowledgebox)}/resources/${encodeURIComponent(rid)}/files`;
  const form = new FormData();
  form.append('file', file, file.name);
  try { console.log('[Nuclia] upload request', { url, name: file.name, type: file.type, size: file.size }); } catch {}
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-NUCLIA-SERVICEACCOUNT': `Bearer ${s.apiKey}` },
    body: form
  });
  const text = await res.text().catch(() => '');
  try { console.log('[Nuclia] upload response', { status: res.status, ok: res.ok, url, body: text }); } catch {}
  if (!res.ok) {
    console.error('Nuclia upload failed', res.status, text);
    throw new Error('Nuclia upload failed');
  }
  try { console.log('[Nuclia] uploadFile success', rid, file?.name); } catch {}
}

// Markdown mappers for app entities
export function mdChallenge(c: { title: string; theme: string; deadline?: string | null; description: string; tags: string[] }) {
  return [
    `## Theme\n${c.theme}`,
    c.deadline ? `\n## Deadline\n${c.deadline}` : '',
    `\n## Description\n${c.description}`,
    c.tags?.length ? `\n## Tags\n${c.tags.map(t => `- ${t}`).join('\n')}` : '',
  ].join('\n');
}

export function mdTask(t: { title: string; status: string; dueDate?: string | null; notes?: string }) {
  return [
    `### Status\n${t.status}`,
    t.dueDate ? `\n### Due\n${t.dueDate}` : '',
    t.notes ? `\n### Notes\n${t.notes}` : ''
  ].join('\n');
}

export function mdIdea(i: { title: string; impact: string; notes: string; tags: string[] }) {
  return [
    `### Impact\n${i.impact}`,
    `\n### Notes\n${i.notes}`,
    i.tags?.length ? `\n### Tags\n${i.tags.map(t => `- ${t}`).join('\n')}` : '',
  ].join('\n');
}

export function mdResource(r: { title: string; type: string; notes?: string; url?: string; tags: string[] }) {
  return [
    `### Type\n${r.type}`,
    r.url ? `\n### URL\n${r.url}` : '',
    r.notes ? `\n### Notes\n${r.notes}` : '',
    r.tags?.length ? `\n### Tags\n${r.tags.map(t => `- ${t}`).join('\n')}` : '',
  ].join('\n');
}
