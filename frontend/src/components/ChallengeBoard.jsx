import React from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  CheckCircle, 
  Calendar, 
  Award, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ChallengeBoard({ overview }) {
  const { t } = useLanguage();
  const challenges = overview?.challenges || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          {t('savingsGoalsTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('savingsGoalsSubtitle')}
        </p>
      </div>

      {/* Challenge Cards */}
      {challenges.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Trophy className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{t('noActiveGoals')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('noActiveGoalsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {challenges.map((ch, idx) => {
            const isFirst = idx === 0;
            const weeks = ch.weeks || [];

            return (
              <div
                key={ch.account}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  isFirst
                    ? 'bg-amber-50/40 dark:bg-gradient-to-r dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-500/40 shadow-xl'
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isFirst 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <Flame className="h-6 w-6 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {ch.title || '8-Week Safety Vault Builder'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Account: {ch.account}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Flame className="h-4 w-4" />
                      <span>{ch.streak || 0} {t('weeklyStreak')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {t('weeklyTarget')}: ₹{Number(ch.target || 200).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500 dark:text-slate-400">{t('goalProgress')}</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {Math.round(ch.progress || 0)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ch.progress || 0)}%` }}
                    />
                  </div>
                </div>

                {/* 8-Week Breakdown Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {weeks.map((saved, wIdx) => {
                    const done = saved >= (ch.target || 200);
                    return (
                      <div 
                        key={wIdx} 
                        className={`p-2.5 rounded-xl border text-center transition ${
                          done 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase">{t('week')} {wIdx + 1}</div>
                        <div className="text-xs font-mono font-bold mt-1">₹{Number(saved).toFixed(0)}</div>
                        <div className="text-[9px] mt-0.5">{done ? '✔' : '–'}</div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
