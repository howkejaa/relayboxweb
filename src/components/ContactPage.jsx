import React from 'react';
import { Send, Radio, ArrowUpRight } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-10">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
          Kontak & saluran resmi
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
          Hubungi pengelola secara langsung untuk pertanyaan teknis, laporan kendala layanan,
          maupun informasi pembaruan sistem RelayBox.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kartu Kontak Owner */}
        <a
          href={SITE_CONFIG.ownerTelegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] p-6 flex flex-col justify-between space-y-6 group transition-colors duration-150"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Send className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <ArrowUpRight
                className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors duration-150"
                strokeWidth={1.5}
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Owner ({SITE_CONFIG.ownerName})
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Kirim pesan langsung ke akun Telegram pengelola untuk bantuan akun, saran fitur,
                atau kerja sama.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-mono text-[#2563EB]">
              {SITE_CONFIG.ownerTelegramHandle}
            </span>
            <span className="text-xs font-medium text-[#0F172A]">Buka Telegram</span>
          </div>
        </a>

        {/* Kartu Saluran Telegram */}
        <a
          href={SITE_CONFIG.telegramChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] p-6 flex flex-col justify-between space-y-6 group transition-colors duration-150"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Radio className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <ArrowUpRight
                className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors duration-150"
                strokeWidth={1.5}
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                {SITE_CONFIG.telegramChannelName}
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Ikuti saluran pengumuman resmi untuk memantau status server, pembaruan API, dan
                rilis fitur terbaru.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-mono text-[#2563EB]">
              {SITE_CONFIG.telegramChannelHandle}
            </span>
            <span className="text-xs font-medium text-[#0F172A]">Gabung saluran</span>
          </div>
        </a>
      </div>
    </div>
  );
}
