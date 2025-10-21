import type { NextApiRequest, NextApiResponse } from 'next';

function getFunctionsApiBaseUrl() {
  const explicit = process.env.FIREBASE_FUNCTION_URL || process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
  if (explicit) {
    const cleaned = explicit.replace(/\/$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  const region = process.env.NEXT_PUBLIC_FUNCTIONS_REGION || 'europe-west1';
  const funcName = 'pulseapi';
  const emulatorHost = process.env.FUNCTIONS_EMULATOR_HOST || process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  if (emulatorHost) {
    const host = emulatorHost.startsWith('http') ? emulatorHost : `http://${emulatorHost}`;
    try {
      const url = new URL(host);
      if ((url.pathname || '/') === '/' && projectId) {
        url.pathname = `/${projectId}/${region}/${funcName}`;
      }
      const base = url.toString().replace(/\/$/, '');
      return `${base}/api`;
    } catch {
      const base = host.replace(/\/$/, '');
      return `${base}/api`;
    }
  }

  if (projectId) {
    return `https://${region}-${projectId}.cloudfunctions.net/${funcName}/api`;
  }

  return `https://${region}.cloudfunctions.net/${funcName}/api`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiBase = getFunctionsApiBaseUrl();
    const targetUrl = `${apiBase}/generate-report`;

    const xffRaw = req.headers['x-forwarded-for'];
    const xff = Array.isArray(xffRaw) ? xffRaw.join(', ') : (xffRaw || '') as string;

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': xff,
      },
      body: JSON.stringify(req.body || {}),
    });

    // This returns a PDF when successful
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (['content-type', 'content-disposition', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    }

    // Fallback: try to normalize errors to JSON so frontend can parse
    const text = await upstream.text();
    if (upstream.status >= 400) {
      res.setHeader('Content-Type', 'application/json');
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        return res.json({ error: text || 'Unknown error' });
      }
    }
    res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
    return res.send(text);
  } catch (error: any) {
    console.error('Proxy generate-report error:', error);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}


