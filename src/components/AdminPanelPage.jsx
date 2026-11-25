import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AdminPanelPage({ user, onBackHome, onSignOut }) {
  // State untuk form login admin jika belum masuk
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // State verifikasi admin & data iklan
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  // State form tambah iklan baru
  const [advertiserName, setAdvertiserName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadAds = useCallback(async () => {
    if (!supabase) return;
    setLoadingAds(true);
    try {
      const { data, error } = await supabase
        .from('popup_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setFormError(err.message || 'Gagal memuat daftar iklan');
    } finally {
      setLoadingAds(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function verifyAdminAccess() {
      if (!user || !supabase || !isSupabaseConfigured) {
        if (active) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        return;
      }

      setCheckingAdmin(true);
      try {
        const { data, error } = await supabase
          .from('app_admins')
          .select('email')
          .ilike('email', user.email)
          .maybeSingle();

        if (!active) return;

        if (!error && data) {
          setIsAdmin(true);
          loadAds();
        } else {
          setIsAdmin(false);
        }
      } finally {
        if (active) setCheckingAdmin(false);
      }
    }

    verifyAdminAccess();
    return () => {
      active = false;
    };
  }, [user, loadAds]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!supabase || !isSupabaseConfigured) {
      setLoginError('Konfigurasi database Supabase belum terpasang.');
      return;
    }

    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });
      if (error) throw error;
    } catch (err) {
      setLoginError(err.message || 'Gagal masuk ke akun admin');
    } finally {
      setLoginLoading(false);
    }
  };

  const normalizeUrl = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanName = advertiserName.trim();
    const cleanImage = normalizeUrl(imageUrl);
    const cleanTarget = normalizeUrl(targetUrl);

    if (!cleanName || !cleanImage || !cleanTarget) {
      setFormError('Lengkapi seluruh kolom nama pengiklan, link gambar, dan link tujuan.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('popup_ads').insert({
        advertiser_name: cleanName,
        image_url: cleanImage,
        target_url: cleanTarget,
        is_active: true
      });

      if (error) throw error;

      setAdvertiserName('');
      setImageUrl('');
      setTargetUrl('');
      setPreviewError(false);
      setFormSuccess('Slot iklan baru berhasil disimpan dan aktif.');
      loadAds();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan iklan baru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (ad) => {
    setFormError('');
    try {
      const { error } = await supabase
        .from('popup_ads')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;
      setAds((prev) =>
        prev.map((item) =>
          item.id === ad.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (err) {
      setFormError(err.message || 'Gagal mengubah status iklan');
    }
  };

  const handleDeleteAd = async (id) => {
    setFormError('');
    try {
      const { error } = await supabase.from('popup_ads').delete().eq('id', id);
      if (error) throw error;
      setAds((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setFormError(err.message || 'Gagal menghapus iklan');
    }
  };

  // Tampilan 1: Pengunjung belum login
  if (!user) {
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
            <span className="text-xs font-mono text-[#2563EB]">Restricted area</span>
            <h1 className="text-xl font-semibold text-[#0F172A]">Admin panel</h1>
            <p className="text-sm text-[#475569]">
              Masuk menggunakan email owner yang terdaftar untuk mengelola slot iklan popup.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#0F172A]">
                Email admin
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="owner@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Kata sandi
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors duration-150"
            >
              {loginLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
              <span>Masuk ke admin panel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tampilan 2: Memeriksa izin database
  if (checkingAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 flex items-center justify-center gap-2.5 text-sm text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} />
        <span>Memverifikasi hak akses admin...</span>
      </div>
    );
  }

  // Tampilan 3: Akun biasa mencoba membuka /adminpanel
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 space-y-5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-[#0F172A]">Akses ditolak</h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Akun <span className="font-mono text-[#0F172A]">{user.email}</span> tidak
              terdaftar sebagai pengelola di tabel admin.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBackHome}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors duration-150"
            >
              Ke beranda
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="py-2.5 px-4 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:text-[#0F172A] transition-colors duration-150"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan 4: Dashboard Admin Panel
  const totalAds = ads.length;
  const activeAdsCount = ads.filter((item) => item.is_active).length;
  const totalClicks = ads.reduce((sum, item) => sum + (Number(item.clicks) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header Admin Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">
            Admin panel · Kelola iklan popup
          </h1>
          <p className="text-sm text-[#475569]">
            Iklan aktif tampil acak dengan jeda 6 menit pada halaman TempMail dan Live Proxy
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] self-start transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Kembali ke website</span>
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Total slot tersimpan</span>
          <div className="text-2xl font-semibold font-mono text-[#0F172A] tabular-nums">
            {totalAds}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Iklan sedang tayang</span>
          <div className="text-2xl font-semibold font-mono text-[#2563EB] tabular-nums">
            {activeAdsCount}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Total klik keseluruhan</span>
          <div className="text-2xl font-semibold font-mono text-[#0F172A] tabular-nums">
            {totalClicks}
          </div>
        </div>
      </div>

      {/* Form Tambah Iklan + Live Preview */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form onSubmit={handleCreateAd} className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Tambah slot iklan baru</h2>

          {formError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-[#2563EB]">
              {formSuccess}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="ad-name" className="block text-sm font-medium text-[#0F172A]">
              Nama pengiklan / judul kampanye
            </label>
            <input
              id="ad-name"
              type="text"
              required
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              placeholder="Contoh: Panel SMM Nusantara"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ad-image" className="block text-sm font-medium text-[#0F172A]">
              Link gambar poster (.jpg / .png / .webp)
            </label>
            <input
              id="ad-image"
              type="url"
              required
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewError(false);
              }}
              placeholder="https://i.ibb.co/.../poster.png"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ad-target" className="block text-sm font-medium text-[#0F172A]">
              Link tujuan saat poster diklik
            </label>
            <input
              id="ad-target"
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://t.me/username_pengiklan"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors duration-150"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span>Simpan & tayangkan iklan</span>
          </button>
        </form>

        {/* Kotak Pratinjau Gambar Poster */}
        <div className="lg:col-span-5 flex flex-col">
          <span className="text-sm font-medium text-[#0F172A] mb-2">Pratinjau poster</span>
          <div className="flex-1 min-h-[220px] rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center p-4 overflow-hidden">
            {imageUrl.trim() && !previewError ? (
              <img
                src={normalizeUrl(imageUrl)}
                alt="Pratinjau poster iklan"
                onError={() => setPreviewError(true)}
                className="max-h-56 w-auto object-contain rounded-lg"
              />
            ) : (
              <div className="text-center space-y-1.5 text-[#64748B]">
                <ImageIcon className="w-6 h-6 mx-auto" strokeWidth={1.5} />
                <p className="text-xs">
                  {previewError
                    ? 'Gambar gagal dimuat, periksa kembali URL gambar'
                    : 'Tempel link gambar untuk melihat pratinjau'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Slot Iklan Terpasang */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#0F172A]">Daftar iklan terpasang</h2>
          <span className="text-xs font-mono text-[#64748B] tabular-nums">
            {ads.length} item
          </span>
        </div>

        {loadingAds ? (
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-12 flex items-center justify-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} />
            <span>Memuat daftar iklan...</span>
          </div>
        ) : ads.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-12 text-center space-y-1">
            <p className="text-sm font-medium text-[#0F172A]">Belum ada slot iklan</p>
            <p className="text-xs text-[#64748B]">
              Tambahkan iklan pertama menggunakan formulir di atas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex items-center justify-center">
                    <img
                      src={ad.image_url}
                      alt={ad.advertiser_name}
                      className="max-h-full w-auto object-contain rounded"
                    />
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#0F172A] truncate">
                        {ad.advertiser_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium shrink-0 ${
                          ad.is_active
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {ad.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <a
                      href={ad.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#475569] hover:text-[#2563EB] max-w-full truncate"
                    >
                      <span className="truncate">{ad.target_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    </a>

                    <div className="pt-1 flex items-center justify-between text-xs text-[#64748B]">
                      <span>Total diklik</span>
                      <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                        {ad.clicks} klik
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ad)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-[#F1F5F9] transition-colors duration-150"
                  >
                    {ad.is_active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                        <span>Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={1.5} />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>

                  {confirmDeleteId === ad.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                      >
                        Hapus permanen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#475569]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(ad.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#475569] hover:text-red-600 hover:border-red-200 transition-colors duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
