import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CooldownVault from './components/CooldownVault';
import Statements from './components/Statements';
import SpendingIntelligence from './components/SpendingIntelligence';
import ChallengeBoard from './components/ChallengeBoard';
import Labs from './components/Labs';
import FreezeModal from './components/FreezeModal';
import CreateAccountModal from './components/CreateAccountModal';
import AuthPage from './components/AuthPage';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './services/api';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [tick, setTick] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  const { t } = useLanguage();

  // Authentication State: Always start as null so Sign Up & Create Account comes first before dashboard
  const [activeCustomer, setActiveCustomer] = useState(null);

  const [selectedAccount, setSelectedAccount] = useState('');
  
  // Modals
  const [freezeAccount, setFreezeAccount] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Transfers pre-fill state
  const [transferType, setTransferType] = useState('TRANSFER');
  const [transferAccount, setTransferAccount] = useState('');

  // Clear any legacy client fallback stores on load
  useEffect(() => {
    try {
      localStorage.removeItem('finguard_local_store');
      localStorage.removeItem('finguard_app_data');
    } catch (e) {}
  }, []);

  // Fetch full overview from API
  const refreshData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await api.getOverview();
      setOverview(data);
      setTick(data.tick);
      setIsOnline(true);

      // If activeCustomer is authenticated, keep it synchronized or log out if deleted from DB
      if (activeCustomer) {
        const matching = (data.customers || []).find((c) => c.id === activeCustomer.id || c.username?.toLowerCase() === activeCustomer.username?.toLowerCase());
        if (matching) {
          setActiveCustomer(matching);
          localStorage.setItem('finguard_active_user', JSON.stringify(matching));
        } else {
          setActiveCustomer(null);
          localStorage.removeItem('finguard_active_user');
          localStorage.removeItem('finguard_selected_account');
        }
      }

      // Auto-select account if none selected
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccount((prev) => {
          let chosen = prev;
          if (!chosen) chosen = data.accounts[0].number;
          const found = data.accounts.find((a) => a.number === chosen);
          const finalAcc = found ? chosen : data.accounts[0].number;
          localStorage.setItem('finguard_selected_account', finalAcc);
          return finalAcc;
        });
      }
    } catch (err) {
      console.warn('Network sync warning:', err.message);
      setIsOnline(false);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [activeCustomer]);

  // Periodic polling for Bank Clock & Queue updates
  useEffect(() => {
    refreshData(true);
    const interval = setInterval(() => {
      refreshData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handle Login & Signup Success
  const handleLoginSuccess = (customer) => {
    setActiveCustomer(customer);
    try {
      localStorage.setItem('finguard_active_user', JSON.stringify(customer));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
    setCurrentTab('dashboard');
    refreshData(false);
  };

  // Handle Sign Out
  const handleLogout = () => {
    setActiveCustomer(null);
    localStorage.removeItem('finguard_active_user');
    localStorage.removeItem('finguard_selected_account');
  };

  // Quick navigation handlers
  const handleOpenTransfer = (type = 'TRANSFER', accountNum = '') => {
    setTransferType(type);
    setTransferAccount(accountNum);
    setCurrentTab('transfers');
  };

  const handleSelectAccountForStatement = (accNum) => {
    setSelectedAccount(accNum);
    setCurrentTab('statements');
  };

  // ALWAYS DISPLAY LOGIN & SIGN UP PAGE FIRST BEFORE ACCESSING THE SITE
  if (!activeCustomer) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NotificationProvider activeCustomer={activeCustomer} overview={overview}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
        
        {/* Top Navigation */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          tick={tick}
          isOnline={isOnline}
          activeCustomer={activeCustomer}
          onLogout={handleLogout}
          cooldownCount={overview?.cooldown?.length || 0}
          onRefresh={() => refreshData(true)}
          loading={loading}
        />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-w-0">
        
        {/* Offline Notice */}
        {!isOnline && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <span className="font-bold">FinGuard Core Engine Offline: </span>
              Ensure the server is running on <code className="font-mono bg-rose-100 dark:bg-rose-950 px-1 py-0.5 rounded">http://localhost:8080</code>.
            </div>
            <button
              onClick={() => refreshData(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 dark:bg-rose-500 text-white dark:text-slate-950 font-bold hover:bg-rose-500 transition flex-shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Views */}
        {currentTab === 'dashboard' && (
          <Dashboard
            overview={overview}
            activeCustomer={activeCustomer}
            onOpenTransfer={handleOpenTransfer}
            onOpenFreezeModal={(acc) => setFreezeAccount(acc)}
            onOpenCreateAccountModal={() => setShowCreateModal(true)}
            onSelectAccountForStatement={handleSelectAccountForStatement}
            onNavigateToSpending={() => setCurrentTab('spending')}
          />
        )}

        {currentTab === 'transfers' && (
          <Transactions
            overview={overview}
            activeCustomer={activeCustomer}
            initialType={transferType}
            initialAccount={transferAccount}
            onSuccess={() => refreshData(false)}
          />
        )}

        {currentTab === 'cooldown' && (
          <CooldownVault
            overview={overview}
            currentTick={tick}
            onRefresh={() => refreshData(false)}
            onCancelSuccess={() => refreshData(false)}
          />
        )}

        {currentTab === 'statements' && (
          <Statements
            overview={overview}
            selectedAccount={selectedAccount}
            onSelectAccount={(acc) => setSelectedAccount(acc)}
          />
        )}

        {currentTab === 'spending' && (
          <SpendingIntelligence
            overview={overview}
            activeCustomer={activeCustomer}
            selectedAccount={selectedAccount}
            onSelectAccount={(acc) => setSelectedAccount(acc)}
          />
        )}

        {currentTab === 'challenges' && (
          <ChallengeBoard overview={overview} />
        )}

        {currentTab === 'labs' && (
          <Labs />
        )}

      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/80 py-6 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="font-semibold text-slate-600 dark:text-slate-400">
            FinGuard Banking Technologies • All Rights Reserved
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>256-bit AES Encryption</span>
            <span>•</span>
            <span>Zero-Drift Clearing</span>
            <span>•</span>
            <span>Multi-Language Active</span>
          </div>
        </div>
      </footer>

      {/* Emergency Lock / Freeze Modal */}
      {freezeAccount && (
        <FreezeModal
          account={freezeAccount}
          onClose={() => setFreezeAccount(null)}
          onSuccess={() => refreshData(false)}
        />
      )}

      {/* Open Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          customers={overview?.customers || []}
          activeCustomer={activeCustomer}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refreshData(false)}
        />
      )}

      </div>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
