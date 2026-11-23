import React, { useState } from 'react';
import { Lock, Unlock, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function FreezeModal({ account, onClose, onSuccess }) {
  const isFrozen = account?.frozen;
  const [pin, setPin] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!account) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your account PIN.');
      return;
    }
    if (isFrozen && phrase.trim().toUpperCase() !== 'UNFREEZE') {
      setError('Please type "UNFREEZE" to confirm restoring access.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isFrozen) {
        await api.unfreeze(account.number, pin, phrase);
      } else {
        await api.freeze(account.number, pin);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative transition-colors">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl border ${
            isFrozen
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {isFrozen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isFrozen ? 'Restore / Unlock Account' : 'Emergency Lock Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {account.number} ({account.holder})
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className={`p-3.5 rounded-xl border text-xs mb-4 ${
          isFrozen
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}>
          {isFrozen ? (
            <p>
              Unlocking requires your security PIN and typing <strong>UNFREEZE</strong>. This restores normal transfer and withdrawal capabilities.
            </p>
          ) : (
            <p>
              Locking immediately halts all outgoing transactions to prevent unauthorized access. Existing balances remain completely safe.
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account PIN
            </label>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          {isFrozen && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">UNFREEZE</span> to confirm
              </label>
              <input
                type="text"
                placeholder="UNFREEZE"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition ${
                isFrozen
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {loading ? 'Processing...' : (isFrozen ? 'Confirm Unlock' : 'Lock Account')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
