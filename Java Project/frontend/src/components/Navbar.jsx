import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Layers, 
  ArrowLeftRight, 
  Lock, 
  ReceiptText, 
  PieChart, 
  Target, 
  Cpu, 
  GraduationCap,
  LogOut, 
  RefreshCw,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  tick, 
  isOnline, 
  activeCustomer, 
  onLogout,
  cooldownCount,
  onRefresh,
  loading
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t, supportedLanguages, currentLanguageObj, isTranslating } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('navOverview'), icon: Layers },
    { id: 'transfers', label: t('navTransfers'), icon: ArrowLeftRight },
    { 
      id: 'cooldown', 
      label: t('navVault'), 
      icon: Lock, 
      badge: cooldownCount > 0 ? cooldownCount : null 
    },
    { id: 'statements', label: t('navLedger'), icon: ReceiptText },
    { id: 'spending', label: t('navSpending'), icon: PieChart },
    { id: 'challenges', label: t('navGoals'), icon: Target },
    { id: 'labs', label: t('navStressLab'), icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  FinGuard
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                  Secure Bank
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Status & Customization Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Live Security Engine Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
              <span className="text-slate-500 dark:text-slate-400">{t('engineClock')}:</span>
              <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-300">
                #{tick !== null ? tick : '--'}
              </span>
            </div>

            {/* Server Online Status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOnline ? t('liveNetwork') : t('disconnected')}</span>
            </div>

            {/* Refresh Data */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
              title={t('syncData')}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Multilingual API Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowLangMenu(!showLangMenu); setShowProfileMenu(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                title="Change Language"
              >
                <span className="text-sm leading-none">{currentLanguageObj.flag}</span>
                <span className="hidden sm:inline font-sans">{currentLanguageObj.name}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
                {isTranslating && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>

              {/* Language Dropdown */}
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Select Language (API)
                  </div>
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition ${
                        language === lang.code
                          ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {language === lang.code && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile & Sign Out */}
            {activeCustomer && (
              <div className="relative">
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLangMenu(false); }}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white dark:text-slate-950 font-mono">
                    {activeCustomer.name ? activeCustomer.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{activeCustomer.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none">{activeCustomer.id}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{activeCustomer.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">ID: {activeCustomer.id}</div>
                      <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">
                        Profile: {activeCustomer.personality || 'Standard'}
                      </div>
                    </div>

                    <div className="px-2 pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t('signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-200/80 dark:border-slate-800/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
