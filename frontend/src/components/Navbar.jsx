import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  ArrowLeftRight, 
  Lock, 
  ReceiptText, 
  PieChart, 
  Target, 
  LogOut, 
  RefreshCw, 
  ChevronDown, 
  Sun, 
  Moon, 
  Check 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown';

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
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 w-full min-w-0">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="h-full w-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  {t('brandTitle')}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                  Bank Core
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Center (Desktop 2xl+): Single-Row Unified Navigation Bar */}
          <nav className="hidden 2xl:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-inner flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Action Controls & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            
            {/* Live Security Engine Status */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
              <span className="text-slate-500 dark:text-slate-400">{t('engineClock')}:</span>
              <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-300">
                #{tick !== null ? tick : '--'}
              </span>
            </div>

            {/* Server Online Status */}
            <div 
              title={isOnline ? t('liveNetwork') : t('disconnected')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
                isOnline 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="hidden xl:inline">{isOnline ? t('liveNetwork') : t('disconnected')}</span>
            </div>

            {/* Instagram Heart Notification Icon */}
            <NotificationDropdown
              onNavigateToStatements={() => setCurrentTab('statements')}
              activeCustomer={activeCustomer}
            />

            {/* Refresh Data */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              title={t('syncData')}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
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
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Change Language"
              >
                <span className="text-sm leading-none">{currentLanguageObj.flag}</span>
                <span className="hidden xl:inline font-sans">{currentLanguageObj.name}</span>
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition cursor-pointer ${
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
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white dark:text-slate-950 font-mono flex-shrink-0">
                    {activeCustomer.name ? activeCustomer.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[90px]">{activeCustomer.name}</div>
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
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition text-left cursor-pointer"
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

        {/* Secondary Navigation Row (For screens < 2xl) */}
        <nav className="2xl:hidden flex space-x-1.5 overflow-x-auto py-2 scrollbar-none border-t border-slate-200/80 dark:border-slate-800/50 w-full min-w-0 max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
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
