import React, { useState, useEffect } from 'react';
import { Business, Notification } from '../../types/models';

interface HeaderProps {
  business: Business;
  notifications: Notification[];
  onOpenMobileMenu: () => void;
  onNavigate: (path: string) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  onOpenMobileMenu,
  onNavigate,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Native install prompt failed, showing guide modal', err);
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md z-40 border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="w-full h-16 px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Logo & Store Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-[#005431] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <span className="font-bold text-xl text-[#005431] tracking-tight hidden sm:inline-block">
              MarketMate<span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">GH</span>
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* Active Store Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors text-left max-w-[200px] md:max-w-xs border border-blue-50/50"
              type="button"
              onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#835500] font-mono-num font-bold uppercase tracking-wider truncate">
                  Active Store
                </span>
                <span className="text-xs text-[#111c2d] font-semibold truncate">
                  {business.name} - {business.branch}
                </span>
              </div>
              <span className="material-symbols-outlined text-gray-500 text-[18px] shrink-0">
                arrow_drop_down
              </span>
            </button>

            {storeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-gray-100 z-50 p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Select Branch
                </div>
                <button
                  type="button"
                  onClick={() => setStoreDropdownOpen(false)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-emerald-50 text-[#005431] font-semibold text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold">{business.name}</div>
                    <div className="text-[11px] text-emerald-700">{business.location}</div>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[#005431]">check_circle</span>
                </button>
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStoreDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_business</span>
                    <span>Add New Stall or Register</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Status, Currency, Install App, Notifications & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install App Button */}
          {!isInstalled ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#005431] hover:bg-[#023b22] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Install MarketMate GH for fast offline access on phone or desktop"
            >
              <span className="material-symbols-outlined text-[17px]">install_mobile</span>
              <span className="hidden sm:inline">Install App</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#005431] text-[11px] font-mono-num font-bold border border-emerald-200/60">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Installed</span>
            </div>
          )}

          {/* Real-time Cloud Sync Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#005431] text-[11px] font-mono-num font-bold border border-emerald-200/60 shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-[#005431]">cloud_done</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>SYNCED JUST NOW</span>
          </div>

          {/* Ghana Cedi Currency Display */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f3ff] text-[#111c2d] text-xs font-mono-num border border-blue-100/60">
            <span className="font-bold text-[#835500]">GH₵</span>
            <span className="text-gray-500 hidden md:inline font-semibold">GHS</span>
          </div>

          {/* Notification Bell */}
          <button
            className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
            )}
          </button>

          {/* Profile Avatar */}
          <div className="relative pl-1">
            <button
              className="flex items-center gap-1.5 rounded-full p-0.5 focus:outline-none hover:ring-2 hover:ring-[#005431]/20 transition-all"
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9iCrw_12oNNYAyioyywXEG906hrkDUsMRnVdGbc262-foNP57FaQPAVE3QNcE36viHAxjb9L-fN19rbDTwGCoIh0VBSP-ooNwuyXel_CgvB-2LlOtMvnb8iqS36rkrmgjfa14XNHwmdmMW_PyKZ8Tp6H76at0TMjK3SwMi-y2LAoysH1w9pD1LC_qxeZs6semDaCbaSqq3iqjB2F5EGW9N2CMd-OA6brzQVeJn_4jQYDQa9ta0oaCkw"
              />
              <span className="material-symbols-outlined text-gray-500 text-[16px] hidden sm:inline-block">
                expand_more
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 z-50 p-2">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <div className="font-bold text-sm text-gray-900">Abena Mensah</div>
                  <div className="text-xs text-gray-500">Shop Owner • Makola #2</div>
                  <div className="text-[10px] font-mono-num text-[#005431] mt-0.5 font-bold">0244 123 890</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>Store Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate('subscription');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  <span>Manage Subscription</span>
                </button>
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleInstallClick();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#005431]">install_mobile</span>
                    <span>Install PWA App</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PWA Install Guidance Modal (fallback when native prompt is pending or iOS Safari) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#005431] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">install_mobile</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Install MarketMate GH</h3>
                  <p className="text-xs text-gray-500">Fast, offline-ready SME Point of Sale</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 bg-[#f0f3ff] p-4 rounded-xl border border-blue-50">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">offline_bolt</span>
                <div>
                  <strong className="text-gray-900 block">Instant Offline Access</strong>
                  Ring up sales and record expenses in Makola or Kejetia even during network outages.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">home_app_logo</span>
                <div>
                  <strong className="text-gray-900 block">No App Store Download Required</strong>
                  Runs natively in standalone fullscreen like an Android or iOS application.
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono-num">
                Quick Setup Steps:
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005431] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <span><strong>Chrome / Android:</strong> Tap the 3 dots (⋮) in the top-right &rarr; <em>Install App</em> or <em>Add to Home Screen</em>.</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005431] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <span><strong>iPhone / iPad (Safari):</strong> Tap the Share button (square with arrow) &rarr; scroll down and tap <em>Add to Home Screen</em>.</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005431] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <span><strong>Desktop (Chrome / Edge):</strong> Click the install icon <span className="font-mono bg-gray-200 px-1 rounded">⊕</span> in the address bar.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#005431] text-white font-bold text-xs hover:bg-[#0d6e43] transition-colors cursor-pointer"
            >
              Got It, Medaase!
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
