import React, { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Download, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Statements({ 
  overview, 
  selectedAccount, 
  onSelectAccount 
}) {
  const { t } = useLanguage();
  const accounts = overview?.accounts || [];
  const currentAcc = selectedAccount || (accounts.length > 0 ? accounts[0].number : '');

  const [statementData, setStatementData] = useState(null);
  const [sort, setSort] = useState('date');
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatement = async (accNum, sortOption) => {
    if (!accNum) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStatement(accNum, sortOption);
      setStatementData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAcc) {
      fetchStatement(currentAcc, sort);
    }
  }, [currentAcc, sort]);

  const items = statementData?.items || [];

  const filteredItems = items.filter(item => {
    if (filterType !== 'ALL' && item.status !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchPurpose = (item.purpose || '').toLowerCase().includes(term);
      const matchCategory = (item.category || '').toLowerCase().includes(term);
      const matchType = (item.type || '').toLowerCase().includes(term);
      const matchFrom = (item.fromAccount || '').toLowerCase().includes(term);
      const matchTo = (item.toAccount || '').toLowerCase().includes(term);
      return matchPurpose || matchCategory || matchType || matchFrom || matchTo;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            {t('ledgerTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('ledgerSubtitle')}
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select Account:</label>
          <select
            value={currentAcc}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {accounts.map(acc => (
              <option key={acc.number} value={acc.number}>
                {acc.number} ({acc.holder} - {acc.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account Snapshot Pill */}
      {statementData?.account && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center font-mono font-bold text-cyan-700 dark:text-cyan-400">
              {statementData.account.type === 'SAVINGS' ? 'SA' : 'CA'}
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{statementData.account.masked}</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{statementData.account.holder}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <div className="text-slate-400 dark:text-slate-500 text-[10px] font-sans">CURRENT BALANCE</div>
              <div className="font-bold text-slate-900 dark:text-white text-base">
                ₹{statementData.account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            {statementData.account.type === 'SAVINGS' ? (
              <div>
                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-sans">VAULT RESERVE</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400">
                  ₹{statementData.account.vault.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-sans">OVERDRAFT LIMIT</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{statementData.account.overdraft.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <div>
              <div className="text-slate-400 dark:text-slate-500 text-[10px] font-sans">TRANSACTIONS</div>
              <div className="font-bold text-slate-700 dark:text-slate-300">{items.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Filter Pills and Sort */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-[11px]">
            {['ALL', 'SUCCESS', 'HELD', 'BLOCKED'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  filterType === f 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-cyan-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="date" className="bg-white dark:bg-slate-900">{t('sortByDate')}</option>
              <option value="amount" className="bg-white dark:bg-slate-900">{t('sortByAmount')}</option>
              <option value="risk" className="bg-white dark:bg-slate-900">{t('sortByRisk')}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fetching statement...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ReceiptText className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">No Transactions Found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Deposit or transfer funds from the Transfers tab to generate statements.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tick</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Counterparty</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Risk</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filteredItems.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'SALARY' || tx.toAccount === currentAcc;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 text-slate-400">
                        #{tx.tick}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {tx.category}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-900 dark:text-white font-medium">
                        {tx.purpose}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {tx.fromAccount && tx.toAccount ? `${tx.fromAccount} → ${tx.toAccount}` : (tx.fromAccount || tx.toAccount || 'Cash Desk')}
                      </td>
                      <td className={`py-3.5 px-4 font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.risk > 50 
                            ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' 
                            : tx.risk > 20 
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' 
                            : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                        }`}>
                          {tx.risk}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                            : tx.status === 'HELD'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
