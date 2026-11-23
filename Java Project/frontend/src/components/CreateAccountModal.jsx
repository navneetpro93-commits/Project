import React, { useState } from 'react';
import { UserPlus, CreditCard, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CreateAccountModal({ 
  customers, 
  activeCustomer, 
  onClose, 
  onSuccess 
}) {
  const [tab, setTab] = useState('account'); // 'account' or 'customer'
  
  // Customer form
  const [custName, setCustName] = useState('');
  const [custPin, setCustPin] = useState('');

  // Account form
  const [targetCustId, setTargetCustId] = useState(activeCustomer?.id || (customers[0]?.id || ''));
  const [accountType, setAccountType] = useState('SAVINGS');
  const [openingBalance, setOpeningBalance] = useState('10000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !custPin.trim()) {
      setError('Name and PIN are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createCustomer(custName.trim(), custPin.trim());
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!targetCustId) {
      setError('Please select a customer profile.');
      return;
    }
    if (!openingBalance || Number(openingBalance) < 0) {
      setError('Please enter a valid opening deposit.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createAccount(targetCustId, accountType, Number(openingBalance));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative transition-colors">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-5 gap-2">
          <button
            onClick={() => { setTab('account'); setError(null); }}
            className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${
              tab === 'account'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Open Bank Account
          </button>
          <button
            onClick={() => { setTab('customer'); setError(null); }}
            className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${
              tab === 'customer'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            New Customer Profile
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'account' ? (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Account Owner
              </label>
              <select
                value={targetCustId}
                onChange={(e) => setTargetCustId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('SAVINGS')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    accountType === 'SAVINGS'
                      ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold">SAVINGS</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Vault savings & 4.5% yield</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('CURRENT')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    accountType === 'CURRENT'
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold">CURRENT</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">₹5,000 Overdraft facility</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Opening Balance (₹)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Open Account'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Security PIN (4 digits)
              </label>
              <input
                type="password"
                placeholder="e.g. 5678"
                maxLength={6}
                value={custPin}
                onChange={(e) => setCustPin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 tracking-widest"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Profile'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
