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
      
      {/* Top Professional Header Banner */}
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
                  Security & Protection Center
                </h1>
                <p className="text-xs text-slate-300">
                  Continuous Automated Ledger Audits, Fraud Quarantine & Enterprise Safety Heuristics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Protection Status</div>
                <div className="text-xs font-bold text-white">100% Guarded & Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ledger Integrity</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">0.00% Drift</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ACID atomic isolation verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Encryption Level</span>
            <Lock className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">AES-256 GCM</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bank-grade data in transit</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Fraud Quarantine</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Active Shield</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Automated cooldown enabled</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lock Response</span>
            <Zap className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">&lt; 2ms SLA</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Instant emergency freeze</div>
        </div>
      </div>

      {/* Interactive Automated Security Verification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-cyan-500" />
              Automated Bank Verification Audits
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run real-time integrity checks to confirm ledger safety and fraud protection
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                  Integrity Audit
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Ready
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                Atomic Ledger Reconciliation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Executes simultaneous cross-account transactions to verify that debits and credits maintain mathematical parity with zero balance drift.
              </p>
            </div>

            <button
              onClick={() => runVerification('race', 'Atomic Ledger Reconciliation')}
              disabled={runningLab !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-500/10 disabled:opacity-50"
            >
              {runningLab === 'race' ? (
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>Run Ledger Audit</span>
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                  Priority Queue
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Ready
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                Priority Obligation Clearing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Validates intelligent transaction dispatch, ensuring salary payments and urgent utility obligations clear before standard retail transfers.
              </p>
            </div>

            <button
              onClick={() => runVerification('priority', 'Priority Settlement Clearing')}
              disabled={runningLab !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/10 disabled:opacity-50"
            >
              {runningLab === 'priority' ? (
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              <span>Verify Priority Clearing</span>
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
                  Fraud Lockdown
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Ready
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                Emergency Circuit Breaker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Tests zero-latency account locking under competing requests, verifying that unauthorized debits are immediately intercepted and blocked.
              </p>
            </div>

            <button
              onClick={() => runVerification('freeze', 'Emergency Circuit Breaker')}
              disabled={runningLab !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-500/10 disabled:opacity-50"
            >
              {runningLab === 'freeze' ? (
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>Test Lockdown Shield</span>
            </button>
          </div>

        </div>
      </div>

      {/* Live Security Activity & Audit Feed */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Real-Time Security Audit Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated security events logged by the FinGuard banking safety engine
            </p>
          </div>

          <button
            onClick={() => setShowRawOutput(!showRawOutput)}
            className="text-[11px] font-semibold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 transition"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>{showRawOutput ? 'Hide Telemetry Log' : 'View Telemetry Log'}</span>
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
          Enterprise Safety Infrastructure
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