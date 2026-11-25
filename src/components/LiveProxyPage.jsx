import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';

const PROXY_REFRESH_SECONDS = 15;

export default function LiveProxyPage() {
  const [proxies, setProxies] = useState([]);
  const [sourceName, setSourceName] = useState('Live Feed');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [countdown, setCountdown] = useState(PROXY_REFRESH_SECONDS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedRow, setCopiedRow] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProxies = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setErrorMsg('');

    try {
      const url = manual ? '/api/proxies?refresh=1' : '/api/proxies';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil daftar proxy');

      setProxies(Array.isArray(data.proxies) ? data.proxies : []);
      if (data.source) setSourceName(data.source);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProxies(false);
  }, [fetchProxies]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchProxies(false);
          return PROXY_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchProxies]);

  const availableCountries = useMemo(() => {
    const set = new Set(proxies.map((p) => p.country).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [proxies]);

  const filteredProxies = useMemo(() => {
    return proxies.filter((item) => {
      const matchProto =
        protocolFilter === 'ALL' || item.protocol.toUpperCase() === protocolFilter;
      const matchCountry =
        countryFilter === 'ALL' || item.country.toUpperCase() === countryFilter;
      return matchProto && matchCountry;
    });
  }, [proxies, protocolFilter, countryFilter]);

  const handleCopyOne = async (proxyString) => {
    await navigator.clipboard.writeText(proxyString);
    setCopiedRow(proxyString);
    setTimeout(() => setCopiedRow(''), 1800);
  };

  const handleCopyAll = async () => {
    if (filteredProxies.length === 0) return;
    const text = filteredProxies.map((p) => `${p.ip}:${p.port}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (filteredProxies.length === 0) return;
    const text = filteredProxies.map((p) => `${p.ip}:${p.port}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relaybox-proxies-${protocolFilter.toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const protocols = ['ALL', 'HTTP', 'SOCKS4', 'SOCKS5'];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Live Proxy</h1>
          <p className="text-sm text-[#475569]">
            Daftar proxy aktif dari {sourceName} dengan pembaruan berkala otomatis
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-xs font-mono text-[#475569] tabular-nums">
              Sync {countdown}d
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCountdown(PROXY_REFRESH_SECONDS);
              fetchProxies(true);
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors duration-150"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563EB] ${refreshing ? 'animate-spin' : ''}`}
              strokeWidth={1.5}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bilah Filter & Ekspor */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {protocols.map((proto) => {
            const active = protocolFilter === proto;
            return (
              <button
                key={proto}
                type="button"
                onClick={() => setProtocolFilter(proto)}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
                }`}
              >
                {proto === 'ALL' ? 'Semua protokol' : proto}
              </button>
            );
          })}

          <select
            aria-label="Filter negara"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
          >
            {availableCountries.map((country) => (
              <option key={country} value={country}>
                {country === 'ALL' ? 'Semua negara' : `Negara: ${country}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono text-[#64748B] mr-1 tabular-nums">
            {filteredProxies.length} tersedia
          </span>

          <button
            type="button"
            onClick={handleCopyAll}
            disabled={filteredProxies.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors duration-150"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={1.5} />
                <span>Semua tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#475569]" strokeWidth={1.5} />
                <span>Salin semua</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={filteredProxies.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors duration-150"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Unduh .txt</span>
          </button>
        </div>
      </div>

      {/* Tabel Daftar Proxy */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2.5 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} />
            <span>Memuat daftar proxy aktif...</span>
          </div>
        ) : filteredProxies.length === 0 ? (
          <div className="p-12 text-center space-y-1.5">
            <p className="text-sm font-medium text-[#0F172A]">Tidak ada proxy sesuai filter</p>
            <p className="text-xs text-[#64748B]">
              Ubah pilihan protokol atau negara di atas untuk menampilkan hasil lain
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-medium text-[#475569]">
                  <th className="py-3.5 px-5">Alamat IP & Port</th>
                  <th className="py-3.5 px-5">Protokol</th>
                  <th className="py-3.5 px-5">Negara</th>
                  <th className="py-3.5 px-5">Latensi</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {filteredProxies.map((item) => {
                  const fullProxy = `${item.ip}:${item.port}`;
                  const isCopied = copiedRow === fullProxy;
                  return (
                    <tr
                      key={fullProxy}
                      className="hover:bg-[#F8FAFC] transition-colors duration-150"
                    >
                      <td className="py-3 px-5 font-mono text-[#0F172A] tabular-nums">
                        {fullProxy}
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#EFF6FF] text-xs font-mono font-medium text-[#2563EB]">
                          {item.protocol}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-[#475569]">
                        {item.country}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-[#64748B] tabular-nums">
                        {item.latency !== null ? `${item.latency} ms` : 'Aktif'}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyOne(fullProxy)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors duration-150"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={1.5} />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
