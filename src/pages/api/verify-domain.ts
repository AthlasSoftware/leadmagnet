import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'node:dns/promises';

async function httpProbe(urlString: string, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(urlString, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(id);
    return response.ok || (response.status >= 200 && response.status < 500);
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const website = String((req.body && (req.body.website || req.body.url)) || '').trim();
    if (!website) {
      return res.status(400).json({ error: 'Saknar webbadress' });
    }

    let normalized = website;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    let url: URL;
    try {
      url = new URL(normalized);
    } catch {
      return res.status(400).json({ error: 'Ogiltig webbadress' });
    }

    const hostname = url.hostname;

    // Basic hostname sanity checks
    if (!hostname || hostname.split('.').length < 2 || /\s/.test(hostname)) {
      return res.status(400).json({ error: 'Ogiltigt domännamn' });
    }

    // DNS resolution: prefer lookup for both A/AAAA
    let addresses: Array<string> = [];
    try {
      const result = await dns.lookup(hostname, { all: true });
      addresses = result.map(r => r.address);
    } catch (e: any) {
      // Try resolve4/resolve6 as fallback
      try {
        const v4 = await dns.resolve4(hostname);
        addresses = addresses.concat(v4);
      } catch {}
      try {
        const v6 = await dns.resolve6(hostname);
        addresses = addresses.concat(v6);
      } catch {}
    }

    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Domänen kunde inte hittas i DNS' });
    }

    // Optional HTTP reachability probe (best-effort)
    const httpReachable = await httpProbe(url.origin, 5000);

    return res.status(200).json({
      ok: true,
      hostname,
      dnsResolved: true,
      httpReachable,
      addresses: addresses.slice(0, 5),
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internt fel vid domänverifiering' });
  }
}


