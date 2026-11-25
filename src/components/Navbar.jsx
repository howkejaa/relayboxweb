import React, { useState } from 'react';
import { Menu, X, LogOut, UserCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({ activePage, onNavigate, user, onSignOut }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Beranda' },
    { id: 'tempmail', label: 'TempMail' },
    { id: 'proxy', label: 'Live Proxy' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleSelect = (pageId) => {
    onNavigate(pageId);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <BrandLogo onClick={() => handleSelect('home')} />

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Navigasi utama">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Tombol Akun Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#475569]">
                <UserCheck className="w-4 h-4 text-[#2563EB]" strokeWidth={1.5} />
                <span className="max-w-[160px] truncate">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSelect('login')}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] hover:text-[#0F172A] transition-colors duration-150"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => handleSelect('register')}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors duration-150"
              >
                Daftar akun
              </button>
            </>
          )}
        </div>

        {/* Tombol Menu Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          className="md:hidden p-2 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 rounded-lg bg-[#F8FAFC] text-xs font-mono text-[#475569] truncate">
                  {user.email}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onSignOut();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A]"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span>Keluar dari akun</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelect('login')}
                  className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A]"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('register')}
                  className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
