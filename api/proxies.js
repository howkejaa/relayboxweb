// Vercel Serverless Function untuk Live Proxy Feeder dengan Smart Cache

let proxyCache = {
  timestamp: 0,
  proxies: [],
  source: 'GeoNode Network'
};

const CACHE_TTL_MS = 15000;

async function fetchFromGeoNode() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);

  try {
    const url =
      'https://proxylist.geonode.com/api/proxy-list?limit=120&page=1&sort_by=lastChecked&sort_type=desc';
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error('GeoNode tidak merespons');
    const json = await response.json();
    const list = Array.isArray(json.data) ? json.data : [];

    return list
      .filter((item) => item.ip && item.port)
      .map((item) => ({
        ip: String(item.ip).trim(),
        port: String(item.port).trim(),
        protocol: Array.isArray(item.protocols) && item.protocols[0]
          ? String(item.protocols[0]).toUpperCase()
          : 'HTTP',
        country: item.country ? String(item.country).toUpperCase() : 'GLOBAL',
        latency: typeof item.latency === 'number' ? Math.round(item.latency) : null
      }));
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromProxyScrape() {
  const protocols = ['http', 'socks4', 'socks5'];
  const results = [];

  await Promise.all(
    protocols.map(async (proto) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const url = `https://api.proxyscrape.com/v2/?request=displayproxies&protocol=${proto}&timeout=5000&country=all&ssl=all&anonymity=all`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const text = await res.text();
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.includes(':'));

        for (const line of lines.slice(0, 45)) {
          const [ip, port] = line.split(':');
          if (ip && port) {
            results.push({
              ip: ip.trim(),
              port: port.trim(),
              protocol: proto.toUpperCase(),
              country: 'GLOBAL',
              latency: null
            });
          }
        }
      } catch {
        // Lewati protokol jika timeout
      } finally {
        clearTimeout(timer);
      }
    })
  );

  return results;
}

async function fetchFromCustomEnv(customUrl) {
  const res = await fetch(customUrl);
  if (!res.ok) throw new Error('Custom proxy API gagal merespons');
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results || data.data || [];
    return list
      .filter((item) => (item.ip || item.proxy_address) && (item.port || item.ports))
      .map((item) => ({
        ip: String(item.ip || item.proxy_address).trim(),
        port: String(item.port || item.ports?.http || item.ports?.socks5).trim(),
        protocol: String(item.protocol || 'HTTP').toUpperCase(),
        country: String(item.country || item.country_code || 'GLOBAL').toUpperCase(),
        latency: item.latency ? Math.round(item.latency) : null
      }));
  }

  const text = await res.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [ip, port] = line.split(':');
      return {
        ip: ip.trim(),
        port: port.trim(),
        protocol: 'HTTP',
        country: 'GLOBAL',
        latency: null
      };
    });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const forceRefresh = req.query?.refresh === '1';
  const now = Date.now();

  if (!forceRefresh && proxyCache.proxies.length > 0 && now - proxyCache.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      proxies: proxyCache.proxies,
      updatedAt: proxyCache.timestamp,
      source: proxyCache.source,
      cached: true
    });
  }

  try {
    let proxies = [];
    let source = 'GeoNode & ProxyScrape';

    if (process.env.CUSTOM_PROXY_API_URL) {
      proxies = await fetchFromCustomEnv(process.env.CUSTOM_PROXY_API_URL);
      source = 'Premium API Feed';
    } else {
      try {
        proxies = await fetchFromGeoNode();
        source = 'GeoNode Live Feed';
      } catch {
        proxies = [];
      }

      if (proxies.length < 15) {
        const fallbackList = await fetchFromProxyScrape();
        proxies = [...proxies, ...fallbackList];
        source = proxies.length > 0 ? 'ProxyScrape Live Feed' : source;
      }
    }

    // Hilangkan duplikat IP:PORT
    const uniqueMap = new Map();
    for (const item of proxies) {
      const key = `${item.ip}:${item.port}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    const cleanList = Array.from(uniqueMap.values());

    if (cleanList.length > 0) {
      proxyCache = {
        timestamp: now,
        proxies: cleanList,
        source
      };
    }

    return res.status(200).json({
      proxies: proxyCache.proxies,
      updatedAt: proxyCache.timestamp || now,
      source: proxyCache.source,
      cached: false
    });
  } catch (err) {
    if (proxyCache.proxies.length > 0) {
      return res.status(200).json({
        proxies: proxyCache.proxies,
        updatedAt: proxyCache.timestamp,
        source: proxyCache.source,
        cached: true
      });
    }
    return res.status(502).json({ error: err.message || 'Gagal memuat daftar proxy' });
  }
}
