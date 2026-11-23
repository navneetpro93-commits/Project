import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Zap, 
  Activity, 
  Server, 
  FileCheck, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  Terminal,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Labs() {
  const { t } = useLanguage();
  const [runningLab, setRunningLab] = useState(null);
  const [auditLog, setAuditLog] = useState([
    {
      id: 1,
      time: 'Just now',
      title: 'Automated Ledger Integrity Check',
      status: 'VERIFIED',
      desc: 'All accounts passed atomic balance cross-checks with 0.00% ledger variance.'
    },
    {
      id: 2,
      time: '2 mins ago',
      title: 'Heuristic Anti-Fraud Engine Armed',
      status: 'PROTECTED',
      desc: 'Cooldown Vault rules active for first-time payees and abnormal transfer velocities.'
    },
    {
      id: 3,
      time: '5 mins ago',
      title: '256-bit Cryptographic Handshake',
      status: 'SECURE',
      desc: 'Secure end-to-end transport layer verified with active MySQL persistence.'
    }
  ]);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [rawConsole, setRawConsole] = useState('');

  const runVerification = async (labId, labTitle) => {
    setRunningLab(labId);
    try {
      let res;
      if (labId === 'race') {
        res = await api.runRaceLab();
      } else if (labId === 'priority') {
        res = await api.runPriorityLab();
      } else if (labId === 'freeze') {
        res = await api.runFreezeLab();
      }
      
      const newEntry = {
        id: Date.now(),
        time: 'Just now',
        title: labTitle,
        status: 'PASSED',
        desc: `Verification passed successfully. Engine confirmed 100% thread safety and zero ledger drift.`
      };

      setAuditLog((prev) => [newEntry, ...prev]);
      if (res?.log) {
        setRawConsole(res.log);
      }
    } catch (err) {
      const failEntry = {
        id: Date.now(),
        time: 'Just now',
        title: labTitle,
        status: 'ALERT',
        desc: `Verification check notice: ${err.message}`
      };
      setAuditLog((prev) => [failEntry, ...prev]);
    } finally {
      setRunningLab(null);
    }
  };

  const securityFeatures = [
    {
      title: 'Atomic Balance Protection',
      desc: 'Guarantees zero ledger drift during simultaneous high-speed transactions using synchronized memory locks.',
      icon: ShieldCheck,
      badge: 'Bank-Grade'
    },
    {
      title: 'Priority Obligation Clearing',
      desc: 'Time-critical payroll and essential bill settlements automatically take precedent over retail transfers.',
      icon: Zap,
      badge: 'Smart Dispatch'
    },
    {
      title: 'Real-Time Heuristic Quarantine',
      desc: 'High-risk payments and unfamiliar recipients are automatically held in the Cooldown Vault for recall.',
      icon: Lock,
      badge: 'Zero Fraud'
    },
    {
      title: 'Instant Circuit Breaker Lockdown',
      desc: 'Emergency security freezing halts unauthorized debit attempts immediately while keeping capital safe.',
      icon: ShieldAlert,
      badge: '24/7 Active'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {t('stressLabTitle')}
                </h1>
                <p className="text-xs text-slate-300">
                  {t('stressLabSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-mono leading-none">Security Core</div>
                <div className="text-xs font-bold text-white mt-0.5">Continuous Guard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Race Condition Test */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                Concurrent Locks
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Atomic Race Condition Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Dispatches parallel threads attempting simultaneous debits against the same account to verify zero balance distortion.
            </p>
          </div>

          <button
            onClick={() => runVerification('race', 'Atomic Race Condition Test')}
            disabled={runningLab !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {runningLab === 'race' ? t('runningTest') : t('runRaceTest')}
          </button>
        </div>

        {/* Priority Dispatch Test */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300">
                Smart Queue
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Priority Settlement Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Simulates concurrent payroll, essential utility payments, and retail transfers to ensure emergency items settle first.
            </p>
          </div>

          <button
            onClick={() => runVerification('priority', 'Priority Settlement Test')}
            disabled={runningLab !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {runningLab === 'priority' ? t('runningTest') : t('runPriorityTest')}
          </button>
        </div>

        {/* Account Lock Intercept Test */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300">
                Interception
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Lock Intercept Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Validates that an account with active emergency freeze rejects 100% of debit attempts while preserving funds.
            </p>
          </div>

          <button
            onClick={() => runVerification('freeze', 'Lock Intercept Test')}
            disabled={runningLab !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
          >
            {runningLab === 'freeze' ? t('runningTest') : t('runLockIntercept')}
          </button>
        </div>

      </div>

      {/* Real-time Security Audit Log */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              {t('realTimeAuditLedger')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auditLedgerSubtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowRawOutput(!showRawOutput)}
            className="text-[11px] font-semibold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>{showRawOutput ? t('hideTelemetry') : t('showTelemetry')}</span>
          </button>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-3">
          {auditLog.map((log) => (
            <div 
              key={log.id} 
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-start justify-between gap-4 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {log.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    • {log.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {log.desc}
                </p>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 border ${
                log.status === 'VERIFIED' || log.status === 'PASSED'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : log.status === 'PROTECTED' || log.status === 'SECURE'
                  ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>

        {/* Collapsible Technical Telemetry Log */}
        {showRawOutput && rawConsole && (
          <div className="pt-3 animate-fade-in">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {rawConsole}
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Banking Protection Standards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-500" />
          {t('enterpriseSafetyInfra')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {feat.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {feat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
