import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const COOLDOWN_MS = 6 * 60 * 1000; // Jeda 6 menit
const INITIAL_DELAY_MS = 10000; // Muncul 3 detik setelah membuka halaman
const LAST_SHOWN_KEY = 'relaybox_popup_ad_last_shown';
const LAST_AD_ID_KEY = 'relaybox_popup_ad_last_id';

export default function PopupAdModal({ activePage }) {
  const [currentAd, setCurrentAd] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const isPickingRef = useRef(false);

  const isEligiblePage = activePage === 'tempmail' || activePage === 'proxy';

  const triggerRandomAd = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || isPickingRef.current) return;

    const lastShownRaw = localStorage.getItem(LAST_SHOWN_KEY);
    const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
    if (Date.now() - lastShown < COOLDOWN_MS) return;

    isPickingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('popup_ads')
        .select('id, advertiser_name, image_url, target_url')
        .eq('is_active', true);

      if (error || !Array.isArray(data) || data.length === 0) return;

      const lastAdId = localStorage.getItem(LAST_AD_ID_KEY);
      const pool =
        data.length > 1 ? data.filter((item) => item.id !== lastAdId) : data;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      localStorage.setItem(LAST_AD_ID_KEY, chosen.id);

      setImageBroken(false);
      setCurrentAd(chosen);
      setIsOpen(true);
    } finally {
      isPickingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isEligiblePage) {
      setIsOpen(false);
      return;
    }

    const lastShownRaw = localStorage.getItem(LAST_SHOWN_KEY);
    const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
    const elapsed = Date.now() - lastShown;
    const waitMs =
      elapsed >= COOLDOWN_MS ? INITIAL_DELAY_MS : COOLDOWN_MS - elapsed;

    const timer = setTimeout(() => {
      triggerRandomAd();
    }, waitMs);

    return () => clearTimeout(timer);
  }, [isEligiblePage, isOpen, triggerRandomAd]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAdClick = () => {
    if (currentAd?.id && supabase) {
      supabase.rpc('increment_ad_click', { ad_id: currentAd.id });
    }
    setIsOpen(false);
  };

  if (!isOpen || !currentAd || imageBroken) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Sponsor ${currentAd.advertiser_name}`}
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] shadow-xl overflow-hidden">
        {/* Bilah Atas Modal */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span className="text-xs font-mono text-[#64748B]">
              Sponsor · {currentAd.advertiser_name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup iklan"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors duration-150"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Poster Iklan */}
        <a
          href={currentAd.target_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="block bg-[#F8FAFC] group focus-visible:outline-none"
        >
          <img
            src={currentAd.image_url}
            alt={currentAd.advertiser_name}
            onError={() => {
              setImageBroken(true);
              setIsOpen(false);
            }}
            className="w-full max-h-[68vh] object-contain mx-auto block"
          />

          <div className="px-4 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-[#475569] truncate">
              Ketuk poster untuk membuka tautan
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] group-hover:underline shrink-0">
              <span>Kunjungi</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
