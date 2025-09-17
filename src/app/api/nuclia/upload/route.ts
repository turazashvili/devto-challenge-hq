import { NextRequest, NextResponse } from 'next/server';

function buildZoneBackend(base: string, zone: string): string {
  try {
    const u = new URL(base);
    const zoneHost = `${zone}.${u.host}`;
    return `${u.protocol}//${zoneHost}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return base.replace(/\/$/, '');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const knowledgebox: string = body.knowledgebox;
    const zone: string = body.zone;
    const backend: string = body.backend || 'https://rag.progress.cloud/api';
    const contentType: string = body.contentType || 'text/MARKDOWN';
    const language: string | undefined = body.language;
    const data: string = body.data || '';
    const clientToken: string | undefined = body.apiKey;

    if (!knowledgebox || !zone || !data) {
      return NextResponse.json({ error: 'Missing knowledgebox, zone, or data' }, { status: 400 });
    }

    const token = clientToken || process.env.NUCLIA_API_KEY || process.env.NUCLIA_SERVICE_ACCOUNT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Server is missing NUCLIA_API_KEY' }, { status: 500 });
    }

    const base = buildZoneBackend(backend, zone);
    const url = `${base}/v1/kb/${encodeURIComponent(knowledgebox)}/upload`;

    const headers: Record<string, string> = {
      'X-NUCLIA-SERVICEACCOUNT': `Bearer ${token}`,
      'content-type': contentType,
    };
    if (language) headers['x-language'] = language;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: data,
    });
    const text = await res.text().catch(() => '');
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      const errorBody = json === null || json === undefined ? text : json;
      return NextResponse.json({ error: 'Nuclia upload failed', status: res.status, body: errorBody }, { status: 502 });
    }

    return NextResponse.json(json ?? { ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

