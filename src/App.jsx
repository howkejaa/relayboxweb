import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import BrandLogo from './components/BrandLogo';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import TempMailPage from './components/TempMailPage';
import LiveProxyPage from './components/LiveProxyPage';
import ContactPage from './components/ContactPage';
import { SITE_CONFIG } from './config/siteConfig';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  // Inisialisasi Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Pantau status sesi login Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const updatedUser = session?.user || null;
      setUser(updatedUser);
      if (updatedUser && (activePage === 'login' || activePage === 'register')) {
        setActivePage('tempmail');
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [activePage]);

  const handleNavigate = (pageId) => {
    // Lindungi halaman TempMail dan Live Proxy agar hanya diakses setelah login
    if ((pageId === 'tempmail' || pageId === 'proxy') && !user) {
      setActivePage('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setActivePage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {!authReady ? (
          <div className="py-24 text-center text-sm text-[#64748B]">Memuat sesi...</div>
        ) : (
          <>
            {activePage === 'home' && (
              <LandingPage user={user} onNavigate={handleNavigate} />
            )}

            {(activePage === 'login' || activePage === 'register') && (
              <AuthPage
                mode={activePage}
                onSwitchMode={(newMode) => setActivePage(newMode)}
                onBackHome={() => handleNavigate('home')}
              />
            )}

            {activePage === 'tempmail' && user && <TempMailPage />}

            {activePage === 'proxy' && user && <LiveProxyPage />}

            {activePage === 'contact' && <ContactPage />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-[#E2E8F0] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <BrandLogo size="sm" onClick={() => handleNavigate('home')} />
          <p className="text-xs font-mono text-[#64748B]">
            © {new Date().getFullYear()} {SITE_CONFIG.appName} — Developed by {SITE_CONFIG.ownerName}
          </p>
        </div>
      </footer>
    </div>
  );
}
