import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Zap, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  Check, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  CreditCard,
  User,
  PlusCircle,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Transactions({
  overview,
  activeCustomer,
  initialType = 'TRANSFER',
  initialAccount = '',
  onSuccess
}) {
  const { t } = useLanguage();
  const [type, setType] = useState(initialType);
  const [fromAccount, setFromAccount] = useState(initialAccount || '');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const accounts = overview?.accounts || [];
  const senderAccounts = activeCustomer
    ? accounts.filter(a => a.customerId === activeCustomer.id)
    : accounts;

  React.useEffect(() => {
    if (!fromAccount && senderAccounts.length > 0) {
      setFromAccount(senderAccounts[0].number);
    }
  }, [senderAccounts, fromAccount]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'BILL') setPurpose('Electricity Bill');
    else if (newType === 'SALARY') setPurpose('Monthly Salary');
    else if (newType === 'DEPOSIT') setPurpose('Cash Deposit');
    else if (newType === 'WITHDRAW') setPurpose('ATM Cash');
    else if (newType === 'TRANSFER') setPurpose('UPI Transfer');
    setResult(null);
    setError(null);
  };

  const presetAmounts = [500, 2000, 5000, 10000, 30000];
  const quickPurposes = [
    'Grocery & Food',
    'Online Shopping',
    'Uber Travel',
    'Electricity Bill',
    'UPI Snacks',
    'Rent payment',
    'Entertainment Movie'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.move({
        type,
        fromAccount: (type === 'DEPOSIT' || type === 'SALARY') ? '' : fromAccount,
        toAccount: (type === 'WITHDRAW') ? '' : (type === 'DEPOSIT' ? fromAccount : toAccount),
        amount: Number(amount),
        purpose: purpose || `${type} Payment`
      });

      setResult({
        ...res,
        paidAmount: Number(amount),
        paidTo: (type === 'WITHDRAW') ? 'Self / ATM Cash' : (type === 'DEPOSIT' ? fromAccount : (toAccount || 'Recipient')),
        paidFrom: (type === 'DEPOSIT' || type === 'SALARY') ? 'Direct Deposit Desk' : fromAccount,
        purposeUsed: purpose || `${type} Payment`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        refId: 'FG' + Math.floor(1000000000 + Math.random() * 9000000000)
      });

      if (res.ok && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Transaction submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Reset to make a new payment (re-shows Transfer & Pay form)
  const handleMakeNewPayment = () => {
    setResult(null);
    setAmount('');
    setError(null);
  };

  const isHighValue = Number(amount) >= 25000;
  const currentFromAccObj = accounts.find(a => a.number === fromAccount);
  const isFrozen = currentFromAccObj?.frozen;

  const typeTabs = [
    { id: 'TRANSFER', label: t('typeTransfer'), icon: ArrowLeftRight },
    { id: 'BILL', label: t('typeBill'), icon: FileText },
    { id: 'SALARY', label: t('typeSalary'), icon: Zap },
    { id: 'DEPOSIT', label: t('typeDeposit'), icon: ArrowDownLeft },
    { id: 'WITHDRAW', label: t('typeWithdraw'), icon: ArrowUpRight },
  ];

  const isSuccess = result?.message?.startsWith('SUCCESS');
  const isHeld = result?.message?.startsWith('HELD');

  // =========================================================================
  // VIEW 1: FULL-PAGE GPAY SUCCESS SCREEN (Transfer & Pay form disappears)
  // =========================================================================
  if (result) {
    return (
      <div className="max-w-xl mx-auto py-4 sm:py-8 px-4 animate-fade-in font-sans">
        
        {/* SUCCESS STATE WITH ICONIC GREEN TICK */}
        {isSuccess && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden transition-colors">
            
            {/* Top ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Google Pay Animated Circular Green Tick */}
            <div className="relative mx-auto my-4 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center animate-pulse">
                <div className="w-18 h-18 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <Check className="h-10 w-10 stroke-[3.5]" />
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              Payment Successful
            </h2>

            {/* Big Bold Rupee Amount */}
            <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white tracking-tight mt-3">
              ₹{Number(result.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            {/* Paid to Recipient */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Paid to <span className="font-extrabold text-slate-900 dark:text-white">{result.paidTo}</span>
            </p>

            {/* Google Pay Style Digital Receipt Slip */}
            <div className="mt-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-left text-xs space-y-3 font-sans">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Transaction Ref ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.refId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Transfer Channel</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Instant UPI / IMPS</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Debited Account</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{result.paidFrom}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Payment Category</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{result.purposeUsed}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Date & Time</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{result.dateStr} at {result.timestamp}</span>
              </div>
            </div>

            {/* BUDGET ALERT NOTIFICATION (If category budget was exceeded or reached warning) */}
            {result.budgetAlert && (
              <div className={`mt-6 p-4 rounded-2xl border text-left flex items-start gap-3.5 shadow-md ${
                result.budgetAlert.exceeded 
                  ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-100 animate-pulse'
                  : 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100'
              }`}>
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                  result.budgetAlert.exceeded ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-tight">
                      {result.budgetAlert.exceeded ? '⚠️ Monthly Budget Exceeded Alert!' : '⚠️ Budget Threshold Warning'}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 font-bold">
                      {result.budgetAlert.category}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {result.budgetAlert.exceeded ? (
                      <>
                        This transaction pushed your total <strong>{result.budgetAlert.category}</strong> spending to{' '}
                        <strong>₹{Number(result.budgetAlert.spent).toLocaleString('en-IN')}</strong>, exceeding your monthly budget limit of{' '}
                        <strong>₹{Number(result.budgetAlert.budget).toLocaleString('en-IN')}</strong> by{' '}
                        <strong className="text-rose-600 dark:text-rose-400 font-black">
                          ₹{Number(result.budgetAlert.overBy).toLocaleString('en-IN')}
                        </strong>!
                      </>
                    ) : (
                      <>
                        You have used <strong>{result.budgetAlert.percent}%</strong> of your monthly{' '}
                        <strong>{result.budgetAlert.category}</strong> budget (Spent: ₹{Number(result.budgetAlert.spent).toLocaleString('en-IN')} / ₹{Number(result.budgetAlert.budget).toLocaleString('en-IN')}).
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* PRIMARY BUTTON: MAKE NEW PAYMENT */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleMakeNewPayment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('makeNewPayment')}</span>
              </button>
            </div>

            {/* Verified Trust Stamp */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Banking Core Settlement</span>
            </div>

          </div>
        )}

        {/* HELD STATE (Safety Vault Quarantine) */}
        {isHeld && (
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden transition-colors">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Placed in Safety Hold
            </h2>
            <div className="text-4xl font-black font-mono text-amber-600 dark:text-amber-400 mt-2">
              ₹{Number(result.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto leading-relaxed">
              High-value transfer securely quarantined in the Cooldown Vault. You can recall this anytime before release.
            </p>
            <div className="mt-8">
              <button
                onClick={handleMakeNewPayment}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                {t('makeNewPayment')}
              </button>
            </div>
          </div>
        )}

        {/* DECLINED STATE */}
        {!isSuccess && !isHeld && (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden transition-colors">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Payment Declined
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-3 max-w-sm mx-auto font-medium leading-relaxed">
              {result.message}
            </p>
            <div className="mt-8">
              <button
                onClick={handleMakeNewPayment}
                className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NORMAL TRANSFER & PAY FORM (Visible before sending payment)
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          {t('transfersTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('transfersSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Transfer Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl transition-colors">
          
          {/* Action Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-5">
            {typeTabs.map(tab => {
              const Icon = tab.icon;
              const active = type === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTypeChange(tab.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[11px] truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Locked Warning */}
          {isFrozen && type !== 'DEPOSIT' && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span>This account is currently locked. Debits and transfers are blocked until unlocked.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Sender / From Account */}
            {type !== 'SALARY' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'DEPOSIT' ? t('creditAccount') : t('debitAccount')}
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {senderAccounts.map((a) => (
                    <option key={a.number} value={a.number}>
                      {a.number} - {a.holder} (Bal: ₹{a.balance.toLocaleString('en-IN')}) {a.frozen ? '🔒 [LOCKED]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient / Beneficiary Account */}
            {(type === 'TRANSFER' || type === 'BILL' || type === 'SALARY') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('beneficiaryAccount')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FG1002 or Beneficiary A/C"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  {/* Quick Select Beneficiaries */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {accounts.filter(a => a.number !== fromAccount).slice(0, 3).map((acc) => (
                      <button
                        key={acc.number}
                        type="button"
                        onClick={() => setToAccount(acc.number)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 font-mono transition cursor-pointer"
                      >
                        + {acc.holder} ({acc.masked})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Amount & Preset Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('amount')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Preset Amount Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-600 transition cursor-pointer"
                  >
                    +₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose / Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('categoryNote')}
              </label>
              <input
                type="text"
                placeholder="e.g. Grocery, Electricity, Rent"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickPurposes.map((qp) => (
                  <button
                    key={qp}
                    type="button"
                    onClick={() => setPurpose(qp)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Value Cooldown Notification */}
            {isHighValue && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>{t('highValueAlert')}</div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isFrozen}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t('clearingTransaction')}</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Pay Now • {type}</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Right: Payment Preview Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 transition-all">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Payment Summary</h4>
                  <p className="text-[10px] text-slate-400">Live Transaction Preview</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Instant UPI Active
              </span>
            </div>

            {/* Amount Display */}
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium">Transfer Amount</span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                ₹{amount ? Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Zero Transfer Fees • 100% Free</span>
            </div>

            {/* Transfer Details List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Recipient
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {toAccount || 'Select Beneficiary'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Pay From
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {fromAccount || 'Primary Account'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Settlement Speed
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Real-Time (&lt; 1 sec)
                </span>
              </div>
            </div>

            {/* Security Seal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-500 flex-shrink-0" />
              <span>Protected by FinGuard Bank-Grade 256-bit Encryption.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
