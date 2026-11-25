import React, { useState } from 'react';
import { MailCheck, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AuthPage({ mode, onSwitchMode, onBackHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Konfigurasi database Supabase belum dipasang pada Environment Variables Vercel.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        if (data?.user && !data?.session) {
          setAwaitingVerification(true);
        } else {
          setInfoMsg('Pendaftaran berhasil dan akun sudah aktif.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setAwaitingVerification(true);
            throw new Error('Email belum diverifikasi. Silakan periksa kotak masuk email kamu.');
          }
          throw error;
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kendala saat memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!supabase || !email) return;
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setInfoMsg('Tautan verifikasi baru telah dikirim ulang ke email kamu.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  if (awaitingVerification) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 space-y-6">
          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <MailCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-[#0F172A]">Periksa kotak masuk email</h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Kami telah mengirimkan tautan verifikasi ke{' '}
              <span className="font-mono text-[#0F172A]">{email}</span>. Klik tautan tersebut
              untuk mengaktifkan akun RelayBox kamu.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-[#2563EB]">
              {infoMsg}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors duration-150"
            >
              {loading ? 'Mengirim ulang...' : 'Kirim ulang email verifikasi'}
            </button>

            <button
              type="button"
              onClick={() => {
                setAwaitingVerification(false);
                onSwitchMode('login');
              }}
              className="w-full py-2.5 px-4 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150"
            >
              Kembali ke halaman masuk
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <button
        type="button"
        onClick={onBackHome}
        className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#0F172A] mb-6 transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Kembali ke beranda</span>
      </button>

      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-[#0F172A]">
            {isRegister ? 'Buat akun RelayBox' : 'Masuk ke RelayBox'}
          </h1>
          <p className="text-sm text-[#475569]">
            {isRegister
              ? 'Daftar menggunakan alamat email aktif untuk menerima tautan verifikasi.'
              : 'Masuk untuk mengakses halaman TempMail dan Live Proxy.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-[#2563EB]">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-sm font-medium text-[#0F172A]">
              Alamat email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block text-sm font-medium text-[#0F172A]">
              Kata sandi
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors duration-150"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
            <span>{isRegister ? 'Daftar & kirim verifikasi' : 'Masuk sekarang'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#E2E8F0] text-center text-sm text-[#475569]">
          {isRegister ? (
            <>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onSwitchMode('login');
                }}
                className="font-medium text-[#2563EB] hover:underline"
              >
                Masuk di sini
              </button>
            </>
          ) : (
            <>
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onSwitchMode('register');
                }}
                className="font-medium text-[#2563EB] hover:underline"
              >
                Daftar akun baru
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
