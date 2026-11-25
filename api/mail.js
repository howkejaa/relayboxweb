// Vercel Serverless Function untuk API TempMail Multi-Provider

const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json'
};

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...COMMON_HEADERS,
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

function safeIsoDate(rawDate) {
  if (!rawDate) return new Date().toISOString();
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

// 1. Jalur Mail.tm & Mail.gw
async function createMailTmFamily(baseUrl, providerKey) {
  const domainsRes = await fetchWithTimeout(`${baseUrl}/domains`);
  if (!domainsRes.ok) throw new Error(`${providerKey} domains HTTP ${domainsRes.status}`);

  const domainsData = await domainsRes.json();
  const domainList = domainsData['hydra:member'] || domainsData || [];
  const activeDomain = domainList.find((d) => d.isActive !== false);
  if (!activeDomain?.domain) throw new Error(`${providerKey} tidak ada domain aktif`);

  const address = `${randomString(10)}@${activeDomain.domain}`;
  const password = `Rb_${randomString(12)}!9`;

  const regRes = await fetchWithTimeout(`${baseUrl}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  if (!regRes.ok) throw new Error(`${providerKey} register HTTP ${regRes.status}`);

  const tokenRes = await fetchWithTimeout(`${baseUrl}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  if (!tokenRes.ok) throw new Error(`${providerKey} token HTTP ${tokenRes.status}`);

  const tokenData = await tokenRes.json();
  return {
    address,
    token: tokenData.token,
    provider: providerKey
  };
}

// 2. Jalur GuerrillaMail (Sangat stabil di IP Vercel/AWS)
async function createGuerrillaMail() {
  const res = await fetchWithTimeout(
    'https://api.guerrillamail.com/ajax.php?f=get_email_address&lang=en'
  );
  if (!res.ok) throw new Error(`GuerrillaMail HTTP ${res.status}`);

  const data = await res.json();
  if (!data.email_addr || !data.sid_token) {
    throw new Error('GuerrillaMail gagal membuat sesi');
  }

  return {
    address: data.email_addr,
    token: data.sid_token,
    provider: 'guerrillamail'
  };
}

// 3. Jalur 1secmail
async function createOneSecMail() {
  const res = await fetchWithTimeout(
    'https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'
  );
  if (!res.ok) throw new Error(`1secmail HTTP ${res.status}`);

  const list = await res.json();
  if (!Array.isArray(list) || !list[0]) {
    throw new Error('1secmail tidak mengembalikan alamat');
  }

  return {
    address: list[0],
    token: list[0],
    provider: '1secmail'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action, token, provider, id } = body;

    // A. Buat alamat email baru (coba 4 jalur secara berurutan)
    if (action === 'create') {
      const creators = [
        () => createMailTmFamily('https://api.mail.tm', 'mail.tm'),
        () => createGuerrillaMail(),
        () => createOneSecMail(),
        () => createMailTmFamily('https://api.mail.gw', 'mail.gw')
      ];

      const errors = [];
      for (const createFn of creators) {
        try {
          const session = await createFn();
          return res.status(200).json(session);
        } catch (err) {
          errors.push(err.message);
        }
      }

      return res.status(502).json({
        error: `Semua server penyedia email sedang sibuk (${errors.join(' | ')})`
      });
    }

    if (!token) {
      return res.status(400).json({ error: 'Token sesi email tidak ditemukan' });
    }

    // B. Ambil daftar kotak masuk sesuai provider aktif
    if (action === 'messages') {
      if (provider === 'guerrillamail') {
        const gmRes = await fetchWithTimeout(
          `https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${encodeURIComponent(token)}`
        );
        if (!gmRes.ok) return res.status(401).json({ error: 'Sesi email berakhir' });

        const gmData = await gmRes.json();
        const rawList = Array.isArray(gmData.list) ? gmData.list : [];
        const messages = rawList.map((item) => ({
          id: String(item.mail_id),
          from: {
            address: item.mail_from || 'pengirim@mail.com',
            name: item.mail_from || 'Pengirim'
          },
          subject: item.mail_subject || '(Tanpa subjek)',
          intro: item.mail_excerpt || '',
          createdAt: item.mail_timestamp
            ? safeIsoDate(Number(item.mail_timestamp) * 1000)
            : new Date().toISOString()
        }));
        return res.status(200).json({ messages });
      }

      if (provider === '1secmail') {
        const [login, domain] = String(token).split('@');
        if (!login || !domain) return res.status(401).json({ error: 'Format sesi tidak valid' });

        const secRes = await fetchWithTimeout(
          `https://www.1secmail.com/api/v1/?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`
        );
        if (!secRes.ok) return res.status(401).json({ error: 'Sesi email berakhir' });

        const secList = await secRes.json();
        const messages = (Array.isArray(secList) ? secList : []).map((item) => ({
          id: String(item.id),
          from: {
            address: item.from || 'pengirim@mail.com',
            name: item.from || 'Pengirim'
          },
          subject: item.subject || '(Tanpa subjek)',
          intro: item.date ? `Masuk pada ${item.date}` : '',
          createdAt: item.date ? safeIsoDate(`${item.date.replace(' ', 'T')}Z`) : new Date().toISOString()
        }));
        return res.status(200).json({ messages });
      }

      // Default: mail.tm atau mail.gw
      const baseUrl = provider === 'mail.gw' ? 'https://api.mail.gw' : 'https://api.mail.tm';
      const msgRes = await fetchWithTimeout(`${baseUrl}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!msgRes.ok) {
        return res.status(msgRes.status).json({ error: 'Sesi email berakhir, buat email baru' });
      }

      const msgData = await msgRes.json();
      return res.status(200).json({ messages: msgData['hydra:member'] || [] });
    }

    // C. Baca detail isi pesan
    if (action === 'message' && id) {
      if (provider === 'guerrillamail') {
        const gmDetailRes = await fetchWithTimeout(
          `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${encodeURIComponent(id)}&sid_token=${encodeURIComponent(token)}`
        );
        if (!gmDetailRes.ok) return res.status(404).json({ error: 'Gagal memuat isi pesan' });

        const data = await gmDetailRes.json();
        const rawBody = data.mail_body || '';
        const plainText = rawBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        return res.status(200).json({
          message: {
            id: String(data.mail_id || id),
            from: { address: data.mail_from || '', name: data.mail_from || '' },
            subject: data.mail_subject || '(Tanpa subjek)',
            text: plainText,
            html: rawBody ? [rawBody] : []
          }
        });
      }

      if (provider === '1secmail') {
        const [login, domain] = String(token).split('@');
        const secDetailRes = await fetchWithTimeout(
          `https://www.1secmail.com/api/v1/?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(id)}`
        );
        if (!secDetailRes.ok) return res.status(404).json({ error: 'Gagal memuat isi pesan' });

        const data = await secDetailRes.json();
        return res.status(200).json({
          message: {
            id: String(data.id || id),
            from: { address: data.from || '', name: data.from || '' },
            subject: data.subject || '(Tanpa subjek)',
            text: data.textBody || data.body || '',
            html: data.htmlBody ? [data.htmlBody] : []
          }
        });
      }

      // Default: mail.tm atau mail.gw
      const baseUrl = provider === 'mail.gw' ? 'https://api.mail.gw' : 'https://api.mail.tm';
      const detailRes = await fetchWithTimeout(`${baseUrl}/messages/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!detailRes.ok) {
        return res.status(detailRes.status).json({ error: 'Gagal memuat isi pesan' });
      }

      const detailData = await detailRes.json();
      return res.status(200).json({ message: detailData });
    }

    return res.status(400).json({ error: 'Aksi tidak dikenali' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server' });
  }
}
