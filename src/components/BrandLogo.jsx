import React, { useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';

export default function BrandLogo({ onClick, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const heightClass = size === 'sm' ? 'h-7' : 'h-9';

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
      aria-label={SITE_CONFIG.appName}
    >
      {!imgError ? (
        <img
          src={SITE_CONFIG.logoPath}
          alt={SITE_CONFIG.appName}
          onError={() => setImgError(true)}
          className={`${heightClass} w-auto object-contain select-none`}
        />
      ) : (
        <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
          {SITE_CONFIG.appName}
        </span>
      )}
    </button>
  );
}
