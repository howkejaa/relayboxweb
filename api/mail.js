// Vercel Serverless Function untuk API TempMail

const PROVIDERS = ['https://api.mail.tm', 'https://api.mail.gw'];

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createAccountFromProvider(baseUrl) {
  const domainsRes = await fetch(`${baseUrl}/domains`, {
    headers: { Accept: 'application/json' }
  });
  if (!domainsRes.ok) throw new Error('Gagal mengambil domain');

  const domainsData = await domainsRes.json();
  const domainList = domainsData['hydra:member'] || domainsData || [];
  const activeDomain = domainList.find((d) => d.isActive !== false);
  if (!activeDomain || !activeDomain.domain) {
    throw new Error('Domain aktif tidak tersedia');
  }

  const address = `${randomString(10)}@${activeDomain.domain}`;
  const password = `Rb_${randomString(12)}!9`;

  const regRes = await fetch(`${baseUrl}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ address, password })
  });

  if (!regRes.ok) throw new Error('Gagal mendaftarkan alamat email');

  const tokenRes = await fetch(`${baseUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ address, password })
  });

  if (!tokenRes.ok) throw new Error('Gagal membuat token sesi');
  const tokenData = await tokenRes.json();

  return {
    address,
    token: tokenData.token,
    provider: baseUrl
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action, token, provider, id } = body;

    // 1. Buat alamat email acak baru
    if (action === 'create') {
      for (const baseUrl of PROVIDERS) {
        try {
          const session = await createAccountFromProvider(baseUrl);
          return res.status(200).json(session);
        } catch {
          continue;
        }
      }
      return res.status(502).json({ error: 'Server penyedia email sedang sibuk, coba lagi' });
    }

    // Validasi token untuk membaca kotak masuk
    const activeProvider = PROVIDERS.includes(provider) ? provider : PROVIDERS[0];
    if (!token) {
      return res.status(400).json({ error: 'Token sesi email tidak ditemukan' });
    }

    // 2. Ambil daftar pesan masuk
    if (action === 'messages') {
      const msgRes = await fetch(`${activeProvider}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!msgRes.ok) {
        return res.status(msgRes.status).json({ error: 'Sesi email berakhir, buat email baru' });
      }

      const msgData = await msgRes.json();
      const items = msgData['hydra:member'] || [];
      return res.status(200).json({ messages: items });
    }

    // 3. Baca detail isi satu pesan
    if (action === 'message' && id) {
      const detailRes = await fetch(`${activeProvider}/messages/${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
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
