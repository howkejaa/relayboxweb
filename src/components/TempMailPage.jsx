import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Inbox,
  KeyRound,
  AlertCircle,
  Loader2
} from 'lucide-react';

const STORAGE_KEY = 'relaybox_tempmail_session';
const REFRESH_INTERVAL = 5;

function extractOtpCode(text) {
  if (!text) return null;
  const contextMatch = text.match(
    /(?:code|kode|otp|verification|verifikasi|pin)[^\d]{0,20}(\d{4,8})\b/i
  );
  if (contextMatch) return contextMatch[1];

  const standaloneMatch = text.match(/\b(\d{6})\b/);
  if (standaloneMatch && standaloneMatch[1] !== '2025' && standaloneMatch[1] !== '2026') {
    return standaloneMatch[1];
  }
  return null;
}

export default function TempMailPage() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createNewAddress = useCallback(async () => {
    setCreating(true);
    setErrorMsg('');
    setMessages([]);
    setSelectedId(null);
    setSelectedMessage(null);

    try {
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat email sementara');

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSession(data);
      setCountdown(REFRESH_INTERVAL);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  }, []);

  const fetchInbox = useCallback(
    async (activeSession = session, silent = false) => {
      if (!activeSession?.token) return;
      if (!silent) setRefreshing(true);

      try {
        const res = await fetch('/api/mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'messages',
            token: activeSession.token,
            provider: activeSession.provider
          })
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(STORAGE_KEY);
            createNewAddress();
          }
          return;
        }
        setMessages(data.messages || []);
      } catch {
        // Abaikan error jaringan sesaat saat polling
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [session, createNewAddress]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.address && parsed?.token) {
          setSession(parsed);
          fetchInbox(parsed, false);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    createNewAddress();
  }, [createNewAddress, fetchInbox]);

  useEffect(() => {
    if (!session?.token) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchInbox(session, true);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, fetchInbox]);

  const handleOpenMessage = async (msgId) => {
    if (!session?.token) return;
    setSelectedId(msgId);
    setLoadingDetail(true);
    setCopiedOtp(false);

    try {
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          id: msgId,
          token: session.token,
          provider: session.provider
        })
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setSelectedMessage(data.message);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!session?.address) return;
    await navigator.clipboard.writeText(session.address);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDeleteSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    createNewAddress();
  };

  const detectedOtp = selectedMessage
    ? extractOtpCode(`${selectedMessage.subject || ''} ${selectedMessage.text || ''}`)
    : null;

  const handleCopyOtp = async () => {
    if (!detectedOtp) return;
    await navigator.clipboard.writeText(detectedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">TempMail</h1>
          <p className="text-sm text-[#475569]">
            Kotak masuk email sementara instan dengan pembaruan otomatis setiap 5 detik
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] self-start">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="text-xs font-mono text-[#475569] tabular-nums">
            Periksa ulang dalam {countdown}d
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={createNewAddress}
            className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-medium hover:bg-red-50"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Panel Alamat Email Aktif */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            {creating ? (
              <div className="flex items-center gap-2.5 text-sm font-mono text-[#64748B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} />
                <span>Menyiapkan alamat email acak...</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-mono font-medium text-[#0F172A] truncate">
                {session?.address || 'Menunggu alamat email'}
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyEmail}
              disabled={!session?.address || creating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors duration-150 shrink-0"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCountdown(REFRESH_INTERVAL);
                fetchInbox(session, false);
              }}
              disabled={refreshing || creating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors duration-150"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#475569] ${refreshing ? 'animate-spin' : ''}`}
                strokeWidth={1.5}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={createNewAddress}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors duration-150"
            >
              <Plus className="w-4 h-4 text-[#2563EB]" strokeWidth={1.5} />
              <span>Email baru</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteSession}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span>Hapus sesi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Area Kotak Masuk & Pembaca Pesan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px]">
        {/* Daftar Pesan */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-sm font-medium text-[#0F172A]">Kotak masuk</span>
            <span className="text-xs font-mono text-[#64748B] tabular-nums">
              {messages.length} pesan
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                <Inbox className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">Belum ada pesan masuk</p>
              <p className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                Gunakan alamat email di atas untuk pendaftaran. Pesan baru akan tampil otomatis di
                sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] overflow-y-auto max-h-[500px]">
              {messages.map((msg) => {
                const isSelected = selectedId === msg.id;
                const otpPreview = extractOtpCode(`${msg.subject || ''} ${msg.intro || ''}`);
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleOpenMessage(msg.id)}
                    className={`w-full text-left p-4 transition-colors duration-150 space-y-1.5 ${
                      isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#0F172A] truncate">
                        {msg.from?.name || msg.from?.address || 'Pengirim'}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B] shrink-0 tabular-nums">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-[#0F172A] truncate">
                      {msg.subject || '(Tanpa subjek)'}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#64748B] truncate">{msg.intro || ''}</p>
                      {otpPreview && (
                        <span className="text-[11px] font-mono font-medium text-[#2563EB] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded shrink-0 tabular-nums">
                          OTP: {otpPreview}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Isi Pesan */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden flex flex-col">
          {loadingDetail ? (
            <div className="flex-1 p-8 flex items-center justify-center gap-2.5 text-sm text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} />
              <span>Memuat isi pesan...</span>
            </div>
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col">
              <div className="p-5 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-[#0F172A]">
                      {selectedMessage.subject || '(Tanpa subjek)'}
                    </h2>
                    <p className="text-xs font-mono text-[#475569]">
                      Dari: {selectedMessage.from?.address || '-'}
                    </p>
                  </div>

                  {detectedOtp && (
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs font-mono font-medium text-[#2563EB] hover:bg-blue-100 transition-colors duration-150 tabular-nums"
                    >
                      <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Kode: {detectedOtp}</span>
                      {copiedOtp ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                      ) : (
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 bg-white">
                {Array.isArray(selectedMessage.html) && selectedMessage.html.length > 0 ? (
                  <iframe
                    title="Isi pesan email"
                    srcDoc={selectedMessage.html.join('')}
                    sandbox=""
                    className="w-full min-h-[340px] border-0"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#0F172A] leading-relaxed">
                    {selectedMessage.text || 'Tidak ada isi teks pada pesan ini.'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-1.5">
              <p className="text-sm font-medium text-[#0F172A]">Pilih pesan untuk membaca</p>
              <p className="text-xs text-[#64748B]">
                Klik salah satu pesan di kolom sebelah kiri untuk menampilkan isi dan kode
                verifikasi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
