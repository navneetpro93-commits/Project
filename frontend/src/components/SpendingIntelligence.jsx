import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  PiggyBank, 
  BrainCircuit, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  X,
  Check,
  Utensils,
  ShoppingBag,
  Compass,
  Receipt,
  Film,
  Banknote,
  ArrowLeftRight,
  Tag,
  AlertOctagon,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function SpendingIntelligence({ 
  overview, 
  selectedAccount, 
  onSelectAccount,
  activeCustomer 
}) {
  const { t } = useLanguage();
  const accounts = overview?.accounts || [];
  const currentAcc = selectedAccount || (accounts.length > 0 ? accounts[0].number : '');

  const [spendingData, setSpendingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  const fetchSpending = async (accNum) => {
    if (!accNum) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSpending(accNum);
      setSpendingData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch spending data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAcc) {
      fetchSpending(currentAcc);
    }
  }, [currentAcc]);

  // Sync budgetForm when spendingData loads
  useEffect(() => {
    if (spendingData?.categories) {
      const initial = {};
      spendingData.categories.forEach(c => {
        const catName = c.category || c.name;
        initial[catName] = c.budget || 0;
      });
      // Ensure defaults if not set
      if (initial['FOOD'] === undefined) initial['FOOD'] = 5000;
      if (initial['SHOPPING'] === undefined) initial['SHOPPING'] = 3000;
      if (initial['TRAVEL'] === undefined) initial['TRAVEL'] = 2000;
      setBudgetForm(initial);
    }
  }, [spendingData]);

  const categories = spendingData?.categories || [];
  const personality = spendingData?.personality || 'Balanced Budgeter';
  const totalDebit = spendingData?.totalDebit || 0;
  const vault = spendingData?.vault || 0;

  // Compute Total Budget & Over-Budget stats
  const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0) || spendingData?.totalBudget || 0;
  const exceededCategories = categories.filter(c => {
    const spent = c.spent !== undefined ? c.spent : (c.used || 0);
    const budget = c.budget || 0;
    return budget > 0 && spent > budget;
  });
  const warningCategories = categories.filter(c => {
    const spent = c.spent !== undefined ? c.spent : (c.used || 0);
    const budget = c.budget || 0;
    return budget > 0 && spent <= budget && spent >= 0.8 * budget;
  });

  const hasExceeded = exceededCategories.length > 0;
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalDebit / totalBudget) * 100)) : 0;
  const remainingTotal = Math.max(0, totalBudget - totalDebit);

  // Category Icon Resolver
  const getCategoryIcon = (category) => {
    const name = (category || '').toUpperCase();
    if (name.includes('FOOD') || name.includes('DINING') || name.includes('GROCERY')) return Utensils;
    if (name.includes('SHOP') || name.includes('RETAIL') || name.includes('MALL')) return ShoppingBag;
    if (name.includes('TRAVEL') || name.includes('TRIP') || name.includes('FUEL')) return Compass;
    if (name.includes('BILL') || name.includes('UTILITY') || name.includes('RENT')) return Receipt;
    if (name.includes('ENTERTAIN') || name.includes('MOVIE') || name.includes('GAME')) return Film;
    if (name.includes('ATM') || name.includes('CASH')) return Banknote;
    if (name.includes('TRANSFER') || name.includes('UPI')) return ArrowLeftRight;
    return Tag;
  };

  // Handle Save Budget
  const handleSaveBudgets = async (e) => {
    if (e) e.preventDefault();
    setSavingBudget(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const currentAccObj = accounts.find(a => a.number === currentAcc);
      const custId = activeCustomer?.id || currentAccObj?.customerId || 'C101';
      
      const payload = {
        customerId: custId,
        account: currentAcc,
        budgets: budgetForm
      };

      const res = await api.updateBudget(payload);
      if (res?.spending) {
        setSpendingData(res.spending);
      } else {
        await fetchSpending(currentAcc);
      }
      setSuccessMsg(t('budgetSavedSuccess', 'Monthly budgets saved successfully!'));
      setShowBudgetModal(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update budgets');
    } finally {
      setSavingBudget(false);
    }
  };

  // Quick single category edit handler
  const handleQuickBudgetChange = (cat, amount) => {
    setBudgetForm(prev => ({
      ...prev,
      [cat]: Number(amount)
    }));
  };

  // Apply User Example Presets
  const applyExamplePreset = () => {
    setBudgetForm(prev => ({
      ...prev,
      FOOD: 5000,
      SHOPPING: 3000,
      TRAVEL: 2000,
      BILLS: 8000,
      ENTERTAINMENT: 2000,
      ATM: 5000,
      TRANSFER: 20000,
      OTHER: 5000,
    }));
  };

  // Add Custom Category
  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    const catKey = newCategoryName.trim().toUpperCase();
    const amt = Number(newCategoryAmount) || 1000;
    setBudgetForm(prev => ({
      ...prev,
      [catKey]: amt
    }));
    setNewCategoryName('');
    setNewCategoryAmount('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('budgetManagerTitle', 'Budget Management & Spending Analytics')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('spendingSubtitle', 'Set monthly category budgets and receive instant alerts when limits are exceeded.')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Account Selector */}
          <select
            value={currentAcc}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
          >
            {accounts.map(acc => (
              <option key={acc.number} value={acc.number}>
                {acc.number} ({acc.holder})
              </option>
            ))}
          </select>

          {/* Set / Edit Budget Button */}
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{t('setBudgetBtn', 'Set Monthly Budget')}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchSpending(currentAcc)}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm cursor-pointer"
            title={t('refreshIntel', 'Refresh Data')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          HIGH PRIORITY ALERT: BUDGET EXCEEDED BANNER
          Appears immediately if any category budget exceeds limit
         ========================================================================= */}
      {hasExceeded && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30 flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm tracking-tight text-rose-950 dark:text-rose-100 uppercase">
                  {t('budgetAlertExceeded', '⚠️ Monthly Budget Limit Exceeded Alert!')}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/60 font-black text-rose-900 dark:text-rose-200">
                  {exceededCategories.length} {exceededCategories.length === 1 ? 'Category' : 'Categories'} Over Limit
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                You have exceeded your monthly allocated budget for{' '}
                <strong className="font-extrabold text-rose-950 dark:text-white">
                  {exceededCategories.map(c => `${c.category || c.name} (₹${(c.spent || c.used || 0).toLocaleString('en-IN')} / ₹${(c.budget || 0).toLocaleString('en-IN')})`).join(', ')}
                </strong>. Total overspent amount:{' '}
                <strong className="underline text-rose-950 dark:text-white">
                  ₹{exceededCategories.reduce((sum, c) => sum + Math.max(0, (c.spent || c.used || 0) - (c.budget || 0)), 0).toLocaleString('en-IN')}
                </strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            {t('adjustBudgets', 'Adjust Budgets')}
          </button>
        </div>
      )}

      {/* Warning Banner: When approaching limit (>80%) and not yet exceeded */}
      {!hasExceeded && warningCategories.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0">
              <AlertOctagon className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold">{t('budgetAlertWarning', 'Budget Warning')}: </span>
              <span>
                You have reached 80%+ of your monthly budget for{' '}
                <strong>{warningCategories.map(c => c.category || c.name).join(', ')}</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
          >
            Review Limits →
          </button>
        </div>
      )}

      {/* Core Budget & Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Monthly Budget */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t('totalMonthlyBudget', 'Total Monthly Budget')}</span>
              <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
              ₹{totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{categories.length} categories active</span>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Edit Limits
            </button>
          </div>
        </div>

        {/* Card 2: Total Spent This Month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t('totalMonthlySpent', 'Total Spent (Debits)')}</span>
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
              ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Monthly Cashflow</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{overallPct}% of budget</span>
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t('remainingBudget', 'Remaining Budget')}</span>
              <PiggyBank className="h-4 w-4 text-emerald-500" />
            </div>
            <div className={`text-2xl font-black font-mono mt-2 ${
              remainingTotal <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              ₹{remainingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Available Cushion</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              remainingTotal <= 0 
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' 
                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              {remainingTotal <= 0 ? 'Deficit' : 'Surplus'}
            </span>
          </div>
        </div>

        {/* Card 4: Financial Persona */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-white/10 rounded-full blur-lg" />
          <div>
            <div className="flex items-center gap-1.5 text-indigo-100 text-xs font-semibold">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>{t('financialPersona', 'Behavioral Profile')}</span>
            </div>
            <div className="text-xl font-black mt-2 tracking-tight">{personality}</div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[10px]">
            <span className="font-mono text-indigo-100">{currentAcc}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 font-bold">AI Evaluated</span>
          </div>
        </div>

      </div>

      {/* Monthly Budget Utilization Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {t('budgetUtilization', 'Overall Monthly Budget Utilization')}
          </span>
          <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
            ₹{totalDebit.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')} ({overallPct}%)
          </span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              totalDebit > totalBudget 
                ? 'bg-rose-500 animate-pulse' 
                : overallPct > 80 
                ? 'bg-amber-500' 
                : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(100, overallPct)}%` }}
          />
        </div>
      </div>

      {/* Category Budgets & Spend Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              {t('monthlyCategoryBudgets', 'Monthly Category Budgets vs Spending')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking for each expense category. Alerts activate when spending crosses budget thresholds.
            </p>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Manage Limits</span>
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No spending records registered for this account yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catName = cat.category || cat.name || 'OTHER';
              const spent = cat.spent !== undefined ? cat.spent : (cat.used || 0);
              const budget = cat.budget || 0;
              const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
              const isOver = budget > 0 && spent > budget;
              const isWarning = budget > 0 && !isOver && pct >= 80;
              const overBy = isOver ? spent - budget : 0;
              const remaining = Math.max(0, budget - spent);
              const CatIcon = getCategoryIcon(catName);

              return (
                <div 
                  key={catName} 
                  className={`p-4 rounded-2xl border transition-all ${
                    isOver 
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-md' 
                      : isWarning
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                      : 'bg-slate-50/60 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        isOver 
                          ? 'bg-rose-500 text-white' 
                          : isWarning 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <CatIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                          {catName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isOver 
                            ? `Over limit by ₹${overBy.toLocaleString('en-IN')}` 
                            : `₹${remaining.toLocaleString('en-IN')} remaining`}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      isOver 
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 animate-pulse' 
                        : isWarning 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' 
                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                    }`}>
                      {isOver 
                        ? t('budgetExceeded', '🚨 Limit Exceeded!') 
                        : isWarning 
                        ? t('budgetNearLimit', `⚠️ ${pct}% Used`) 
                        : t('budgetHealthy', `✅ ${pct}% Healthy`)}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <span className="text-slate-500">
                      Spent: <strong className={isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>₹{spent.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-slate-500">
                      Budget: <strong className="text-slate-900 dark:text-white">₹{budget.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOver 
                          ? 'bg-rose-500' 
                          : isWarning 
                          ? 'bg-amber-500' 
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          BUDGET MANAGEMENT MODAL
          User apna monthly budget set kar sake (Food: ₹5,000, Shopping: ₹3,000, Travel: ₹2,000)
         ========================================================================= */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {t('setBudgetBtn', 'Set Monthly Budget Limits')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define monthly spending thresholds per category.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Template Preset Button */}
            <div className="mt-4 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-indigo-900 dark:text-indigo-200">Recommended Template: </span>
                <span className="text-indigo-700 dark:text-indigo-300">Food: ₹5k • Shopping: ₹3k • Travel: ₹2k</span>
              </div>
              <button
                type="button"
                onClick={applyExamplePreset}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm cursor-pointer whitespace-nowrap"
              >
                Apply Preset
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveBudgets} className="mt-4 overflow-y-auto space-y-3.5 flex-1 pr-1">
              
              {/* Category Inputs */}
              {Object.keys(budgetForm).map((cat) => {
                const CatIcon = getCategoryIcon(cat);
                return (
                  <div key={cat} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <CatIcon className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {cat}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <span className="text-xs text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={budgetForm[cat] !== undefined ? budgetForm[cat] : ''}
                        onChange={(e) => handleQuickBudgetChange(cat, e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Add Custom Category Row */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 mb-2">Add Custom Category</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category (e.g. GYM)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1 w-28">
                    <span className="text-xs text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newCategoryAmount}
                      onChange={(e) => setNewCategoryAmount(e.target.value)}
                      placeholder="Budget"
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Add Category"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Total Monthly Budget Sum in Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">Total Monthly Budget:</span>
                <span className="font-mono text-base text-indigo-600 dark:text-indigo-400">
                  ₹{Object.values(budgetForm).reduce((sum, val) => sum + (Number(val) || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingBudget ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('saveBudgetsBtn', 'Save Monthly Budget')}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
