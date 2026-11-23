import React, { useState } from 'react';
import { 
  Award, 
  Activity, 
  ShieldCheck, 
  FileCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  CreditCard,
  Building2,
  Scale,
  Percent,
  Check,
  Zap,
  TrendingUp,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({
  overview,
  activeCustomer,
  onOpenTransfer,
  onOpenFreezeModal,
  onOpenCreateAccountModal,
  onSelectAccountForStatement,
  onNavigateToSpending,
}) {
  const { t } = useLanguage();
  const [showBalanceMap, setShowBalanceMap] = useState({});
  const [spendingInfo, setSpendingInfo] = useState(null);

  const toggleShowBalance = (accNum) => {
    setShowBalanceMap(prev => ({ ...prev, [accNum]: !prev[accNum] }));
  };

  const accounts = overview?.accounts || [];
  const customerAccounts = activeCustomer 
    ? accounts.filter(a => a.customerId === activeCustomer.id)
    : accounts;

  const totalVault = customerAccounts.reduce((acc, curr) => acc + (curr.vault || 0), 0);
  const frozenCount = customerAccounts.filter(a => a.frozen).length;
  const cooldownCount = overview?.cooldown?.length || 0;

  React.useEffect(() => {
    if (customerAccounts.length > 0) {
      api.getSpending(customerAccounts[0].number)
        .then(data => setSpendingInfo(data))
        .catch(() => {});
    }
  }, [customerAccounts.length, overview?.tick]);

  return (
    <div className="space-y-6">

      {/* Monthly Budget Exceeded Alert Banner (Global Attention Notification) */}
      {spendingInfo?.hasExceeded && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white flex-shrink-0">
              <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold uppercase text-xs">⚠️ Monthly Budget Exceeded Alert: </span>
              <span className="text-rose-800 dark:text-rose-200">
                You have exceeded your monthly budget for <strong>{spendingInfo.exceededCategories}</strong>!
              </span>
            </div>
          </div>
          {onNavigateToSpending && (
            <button
              onClick={onNavigateToSpending}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              Review & Manage Budgets →
            </button>
          )}
        </div>
      )}
      
      {/* Top Banner & Customer Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <div className="h-full w-full bg-slate-50 dark:bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-2xl text-cyan-600 dark:text-cyan-400 font-mono">
              {activeCustomer?.name ? activeCustomer.name[0].toUpperCase() : 'F'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('welcomeBack')}, {activeCustomer ? activeCustomer.name : 'Customer'}
              </h2>
              {activeCustomer && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  {activeCustomer.id}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>{t('activeVerified')}:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('allSecured')}
              </span>
              <span>•</span>
              <span>{customerAccounts.length} {t('connectedAccounts')}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenTransfer('DEPOSIT')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold transition cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>{t('depositFunds')}</span>
          </button>
          <button
            onClick={() => onOpenTransfer('TRANSFER')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>{t('sendMoney')}</span>
          </button>
          <button
            onClick={onOpenCreateAccountModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>{t('openAccount')}</span>
          </button>
        </div>
      </div>

      {/* Primary Prudential Factors Bar (Utilizing Space with Real Banking Factors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Factor 1: Credit Bureau Rating (CIBIL / Experian) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-md transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              <span>{t('creditScoreTitle')}</span>
              <Award className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {t('creditScoreValue')}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {t('creditScoreBadge')}
            </span>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
              {t('creditScoreDesc')}
            </div>
          </div>
        </div>

        {/* Factor 2: Daily Clearing Runway & Settlement Velocity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-md transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              <span>{t('dailyLimitTitle')}</span>
              <Activity className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
              {t('dailyLimitValue')}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
              {t('dailyLimitBadge')}
            </span>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
              {t('dailyLimitDesc')}
            </div>
          </div>
        </div>

        {/* Factor 3: Regulatory Compliance & KYC */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-md transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              <span>{t('regulatoryKycTitle')}</span>
              <FileCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {t('regulatoryKycValue')}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
              {t('regulatoryKycBadge')}
            </span>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
              {t('regulatoryKycDesc')}
            </div>
          </div>
        </div>

        {/* Factor 4: Institutional Safety & Quarantine Grade */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-md transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              <span>{t('threatAssessmentTitle')}</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {t('threatAssessmentValue')}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
              {t('threatAssessmentBadge')}
            </span>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
              {t('threatAssessmentDesc')}
            </div>
          </div>
        </div>

      </div>

      {/* Institutional Banking Risk & Health Indicators Row */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {t('bankingFactorsTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('bankingFactorsSubtitle')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/20 w-fit">
            Basel III Framework
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Factor A: Debt-to-Income */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Percent className="h-3.5 w-3.5 text-indigo-500" />
              <span>{t('debtToIncomeTitle')}</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
              {t('debtToIncomeValue')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Benchmark: &lt; 36% Debt threshold</div>
          </div>

          {/* Factor B: Deposit Insurance Coverage */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t('depositInsuranceTitle')}</span>
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
              {t('depositInsuranceValue')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">DICGC / Central Reserve Guaranteed</div>
          </div>

          {/* Factor C: Liquidity Coverage Ratio */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Scale className="h-3.5 w-3.5 text-cyan-500" />
              <span>{t('capitalAdequacyTitle')}</span>
            </div>
            <div className="text-base font-bold text-cyan-600 dark:text-cyan-400 mt-1.5 font-mono">
              {t('capitalAdequacyValue')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Regulatory minimum requirement: 1.0x</div>
          </div>

          {/* Factor D: AML Risk Tier */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Check className="h-3.5 w-3.5 text-purple-500" />
              <span>{t('antiMoneyLaunderingTitle')}</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
              {t('antiMoneyLaunderingValue')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Continuous heuristic AML screening</div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
            {t('yourAccountsCards')}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {customerAccounts.length} Verified
          </span>
        </div>

        {customerAccounts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-md">
            <CreditCard className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{t('openAccount')}</p>
            <button
              onClick={onOpenCreateAccountModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t('openAccount')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {customerAccounts.map((account) => {
              const showBalance = !!showBalanceMap[account.number];
              const isSavings = account.type === 'SAVINGS';
              const isFrozen = account.frozen;

              return (
                <div
                  key={account.number}
                  className={`p-6 rounded-3xl border transition-all ${
                    isFrozen
                      ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/50'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl'
                  }`}
                >
                  
                  {/* Account Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border font-bold text-xs font-mono ${
                        isSavings
                          ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                          : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {account.type}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                          {account.masked}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t('holder')}: <span className="font-semibold text-slate-800 dark:text-slate-200">{account.holder}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isFrozen ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <Lock className="h-2.5 w-2.5" />
                          {t('locked')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t('primeStanding')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Standing & Institutional Parameters Box (Replaces Raw Bank Balance) */}
                  <div className="mt-5 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {t('accountStanding')}
                      </span>
                      {/* Discreet peek toggle button */}
                      <button
                        onClick={() => toggleShowBalance(account.number)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer"
                        title={showBalance ? "Hide Numerical Balance" : "Show Numerical Balance"}
                      >
                        {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span>{showBalance ? "Hide" : "Inspect Balance"}</span>
                      </button>
                    </div>

                    {showBalance ? (
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white animate-fade-in">
                        ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Tier-1 Prime Liquidity Account</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {isSavings 
                            ? 'Protected by automated high-yield vault & reserve quarantine.' 
                            : 'Unrestricted enterprise clearing cushion with instant overdraft facility.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Banking Capacity & Facility Parameters */}
                  <div className="grid grid-cols-2 gap-3 py-2.5 px-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 text-xs mb-5">
                    {isSavings ? (
                      <>
                        <div>
                          <div className="text-slate-500 text-[11px] font-medium">{t('annualYield')}</div>
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">4.50% p.a.</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[11px] font-medium">Daily Limit Headroom</div>
                          <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">₹1,00,000 / Day</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-slate-500 text-[11px] font-medium">{t('overdraftFacility')}</div>
                          <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{account.overdraft.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[11px] font-medium">Credit Cushion</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white">Active Reserve</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => onSelectAccountForStatement(account.number)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition text-center cursor-pointer"
                    >
                      {t('auditLedger')}
                    </button>
                    <button
                      onClick={() => onOpenTransfer('TRANSFER', account.number)}
                      disabled={isFrozen}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-semibold transition text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {t('transfer')}
                    </button>
                    <button
                      onClick={() => onOpenFreezeModal(account)}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isFrozen
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                      }`}
                      title={isFrozen ? t('unlockAccount') : t('lockAccount')}
                    >
                      {isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
