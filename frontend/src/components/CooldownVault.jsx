import React, { useState } from 'react';
import { 
  Lock, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function CooldownVault({ 
  overview, 
  currentTick, 
  onRefresh, 
  onCancelSuccess 
}) {
  const { t } = useLanguage();
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const heldList = overview?.cooldown || [];

  const handleCancel = async (id) => {
    setCancellingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.cancelCooldown(id);
      if (res.cancelled) {
        setMessage(`Transaction #${id} successfully cancelled and recalled. Funds returned to source account.`);
        if (onCancelSuccess) onCancelSuccess();
      } else {
        setError(`Could not cancel #${id}: it may have already been cleared or settled.`);
      }
    } catch (err) {
      setError(err.message || 'Cancel request failed');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              {t('vaultTitle')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              {heldList.length} {t('pendingBadge')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('vaultSubtitle')}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-500" />
          <span>{t('syncQueue')}</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      {heldList.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-md">
          <ShieldCheck className="h-12 w-12 text-emerald-500/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('holdQueueClear')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {t('holdQueueClearDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('txnId')}</th>
                  <th className="py-3.5 px-4">{t('fromAccountCol')}</th>
                  <th className="py-3.5 px-4">{t('recipientCol')}</th>
                  <th className="py-3.5 px-4">{t('amountCol')}</th>
                  <th className="py-3.5 px-4">{t('noteCol')}</th>
                  <th className="py-3.5 px-4">{t('timerCol')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actionCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {heldList.map((tx) => {
                  const ticksLeft = Math.max(0, (tx.readyTick || 0) - (currentTick || 0));
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
                        #{tx.id}
                      </td>
                      <td className="py-4 px-4 text-slate-800 dark:text-slate-200">
                        {tx.fromAccount}
                      </td>
                      <td className="py-4 px-4 text-slate-800 dark:text-slate-200">
                        {tx.toAccount || 'N/A'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {tx.purpose}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                          <span className="font-semibold text-amber-600 dark:text-amber-300">
                            {ticksLeft > 0 ? `${ticksLeft} ${t('ticksRemaining')}` : t('releasingNow')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            (Tick #{tx.readyTick})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleCancel(tx.id)}
                          disabled={cancellingId === tx.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-sans text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{cancellingId === tx.id ? t('cancelling') : t('cancelAndRecall')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Protection Rules */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Info className="h-4 w-4 text-cyan-500" />
          <span>{t('vaultExplainerTitle')}</span>
        </div>
        <p className="leading-relaxed">
          {t('vaultExplainerDesc')}
        </p>
      </div>

    </div>
  );
}
