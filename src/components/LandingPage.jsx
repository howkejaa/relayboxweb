import React from 'react';
import {
  Mail,
  Globe,
  ShieldCheck,
  ArrowRight,
  Copy,
  RefreshCw,
  Lock
} from 'lucide-react';

export default function LandingPage({ user, onNavigate }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-20">
      {/* Split Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-xs font-mono text-[#475569]">
              TempMail & Live Proxy Platform
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#0F172A] leading-[1.15]">
            Kotak masuk sementara dan umpan proxy aktif dalam satu ruang kerja
          </h1>

          <p className="text-base text-[#475569] leading-relaxed">
            Buat alamat email sementara secara instan untuk menerima kode verifikasi, dan akses
            daftar proxy terkurasi yang diperbarui berkala melalui jalur API yang stabil.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('tempmail')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors duration-150"
                >
                  <span>Buka TempMail</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('proxy')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-medium hover:bg-[#F8FAFC] transition-colors duration-150"
                >
                  <span>Buka Live Proxy</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors duration-150"
                >
                  <span>Daftar akun gratis</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-medium hover:bg-[#F8FAFC] transition-colors duration-150"
                >
                  <span>Masuk ke akun</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Visual Product Preview */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
            {/* Window Header */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
              </div>
              <span className="text-xs font-mono text-[#64748B]">relaybox.app/workspace</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#2563EB]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>Live</span>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-5">
              {/* Mini TempMail Card */}
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#475569]">Alamat email aktif</span>
                  <span className="text-xs font-mono text-[#2563EB]">Auto-refresh 5d</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3.5 py-2.5">
                  <span className="text-sm font-mono text-[#0F172A] truncate">
                    k9x4m2p8q1@mail.tm
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] shrink-0">
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Salin</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#475569] pt-1">
                  <span>Kode verifikasi terbaru terdeteksi</span>
                  <span className="font-mono font-medium text-[#0F172A] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded tabular-nums">
                    482910
                  </span>
                </div>
              </div>

              {/* Mini Proxy Table */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-xs font-medium text-[#475569]">Umpan proxy aktif</span>
                  <span className="text-xs font-mono text-[#64748B] tabular-nums">
                    HTTP / SOCKS5
                  </span>
                </div>
                <div className="divide-y divide-[#E2E8F0] text-xs font-mono">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#0F172A] tabular-nums">103.152.112.145:8080</span>
                    <span className="text-[#2563EB]">SOCKS5</span>
                    <span className="text-[#64748B] tabular-nums">42 ms</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#0F172A] tabular-nums">185.199.229.156:7492</span>
                    <span className="text-[#2563EB]">HTTP</span>
                    <span className="text-[#64748B] tabular-nums">58 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-[#E2E8F0] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Mail className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-[#0F172A]">TempMail otomatis</h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Alamat email acak dibuat otomatis tanpa pendaftaran rumit. Kotak masuk diperiksa
            setiap 5 detik dan menyorot kode OTP secara langsung.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Globe className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-[#0F172A]">Live Proxy feeder</h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Daftar proxy HTTP, SOCKS4, dan SOCKS5 ditarik dari jalur API terkurasi dengan cache
            cerdas agar selalu segar, stabil, dan siap diunduh dalam format teks.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#E2E8F0] p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-[#0F172A]">Akses terverifikasi</h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Dilengkapi autentikasi akun dan verifikasi email untuk menjaga kestabilan kuota API
            serta melindungi sesi pengguna dari penyalahgunaan bot otomatis.
          </p>
        </div>
      </section>

      {/* Bottom CTA Strip */}
      <section className="rounded-2xl bg-white border border-[#E2E8F0] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#2563EB]">
            <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Halaman terpisah & terstruktur</span>
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Siap menggunakan TempMail dan Live Proxy
          </h2>
          <p className="text-sm text-[#475569]">
            Masuk dengan akun terverifikasi untuk mulai mengelola kotak masuk sementara dan
            mengambil daftar proxy aktif.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150"
          >
            Hubungi owner
          </button>
          <button
            type="button"
            onClick={() => onNavigate(user ? 'tempmail' : 'register')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors duration-150"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            <span>{user ? 'Masuk ke ruang kerja' : 'Buat akun'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
