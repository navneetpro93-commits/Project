import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Clock, 
  ReceiptText, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationDropdown({ onNavigateToStatements, activeCustomer }) {
  const { 
    notifications, 
    unreadCount, 
    hasUnread, 
    markAllAsRead, 
    clearAllNotifications,
    removeNotification,
    addNotification 
  } = useNotifications();

  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'RECEIVED' | 'DEBITED'
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When clicking the heart:
  // 1. If currently has unread notifications (red heart), mark all as read so it immediately turns into a NORMAL HEART!
  // 2. Toggle open/close the dropdown menu
  const handleHeartClick = () => {
    if (hasUnread) {
      markAllAsRead();
    }
    setIsOpen(prev => !prev);
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter(item => {
    if (filter === 'RECEIVED') return item.type === 'RECEIVED';
    if (filter === 'DEBITED') return item.type === 'DEBITED';
    return true;
  });

  // Test simulation triggers
  const handleSimulateReceived = (e) => {
    e.stopPropagation();
    const mockAmounts = [1200, 2500, 5000, 15000];
    const amount = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
    const accountNum = activeCustomer?.accounts?.[0] || 'FG1001';
    
    addNotification({
      type: 'RECEIVED',
      title: `Payment Received • ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      amount,
      account: accountNum,
      fromAccount: 'Beneficiary / UPI Sender',
      toAccount: accountNum,
      purpose: 'Client UPI Settlement',
      category: 'TRANSFER',
      status: 'SUCCESS'
    });
  };

  const handleSimulateDebited = (e) => {
    e.stopPropagation();
    const mockAmounts = [350, 780, 1450, 3200];
    const amount = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
    const accountNum = activeCustomer?.accounts?.[0] || 'FG1001';

    addNotification({
      type: 'DEBITED',
      title: `Payment Debited • ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      amount,
      account: accountNum,
      fromAccount: accountNum,
      toAccount: 'Merchant / Bill Pay',
      purpose: 'Online Shopping & Bills',
      category: 'SHOPPING',
      status: 'SUCCESS'
    });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      
      {/* ==================================================================== */}
      {/* INSTAGRAM HEART NOTIFICATION NAVBAR BUTTON                           */}
      {/* - Shows RED color and red badge when unread payment notification exists */}
      {/* - Clicking it turns it back into a NORMAL HEART                     */}
      {/* ==================================================================== */}
      <button
        onClick={handleHeartClick}
        aria-label="Notifications"
        title={hasUnread ? `${unreadCount} new payment notification(s)! Click to view` : "Notifications"}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          hasUnread
            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-500 border border-rose-200 dark:border-rose-500/40 shadow-md shadow-rose-500/20'
            : isOpen
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
            : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {/* Heart Icon: Turns solid vibrant RED on notification; normal outline heart when read or clicked */}
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            hasUnread
              ? 'fill-rose-500 text-rose-500 scale-110 animate-pulse drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]'
              : 'fill-none stroke-current'
          }`}
          strokeWidth={hasUnread ? 2.5 : 2}
        />

        {/* Instagram-style Red Notification Badge Dot with Unread Count */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950 shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ==================================================================== */}
      {/* INSTAGRAM-STYLE NOTIFICATIONS DROPDOWN POPOVER MENU                  */}
      {/* ==================================================================== */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl py-3 z-50 animate-fade-in font-sans">
          
          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 flex items-center justify-center text-rose-500">
                <Heart className="h-4 w-4 fill-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                  Activity
                </h3>
                <p className="text-[10px] text-slate-400">Payment received & debited alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    title="Clear notifications"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'RECEIVED', label: 'Received' },
              { id: 'DEBITED', label: 'Debited' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto px-2 py-2 space-y-1.5 scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Heart className="h-6 w-6 stroke-1" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {notifications.length === 0 ? "You're all caught up!" : "No notifications for this filter"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Real-time alerts for incoming deposits and outgoing debits will appear here like in Instagram.
                </p>

                {/* Instant Simulation Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleSimulateReceived}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <ArrowDownLeft className="h-3 w-3" />
                    <span>+ Test Receive ₹2,500</span>
                  </button>
                  <button
                    onClick={handleSimulateDebited}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    <span>- Test Debit ₹750</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isReceived = notif.type === 'RECEIVED';
                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl transition-all duration-150 flex items-start gap-3 border ${
                      notif.isRead
                        ? 'bg-slate-50/50 dark:bg-slate-800/30 border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                        : isReceived
                        ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20'
                        : 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200/70 dark:border-rose-500/20'
                    }`}
                  >
                    {/* Direction Icon Badge */}
                    <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                      isReceived
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    }`}>
                      {isReceived ? (
                        <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black font-mono tracking-tight ${
                          isReceived ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isReceived ? '+' : '-'}₹{Number(notif.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                        {isReceived ? 'Payment Received' : 'Payment Debited'}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {notif.purpose}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                          {notif.account || notif.toAccount || notif.fromAccount}
                        </span>
                        {notif.tick !== undefined && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            #{notif.tick}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Delete or Unread Indicator */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" title="Unread" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 p-0.5 transition cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Simulate Trigger Bar at bottom of active list */}
          {filteredNotifications.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-medium">Test Alerts:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSimulateReceived}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer font-semibold"
                >
                  + Receive
                </button>
                <button
                  onClick={handleSimulateDebited}
                  className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer font-semibold"
                >
                  - Debit
                </button>
              </div>
            </div>
          )}

          {/* Footer: Navigate to Ledger */}
          {onNavigateToStatements && (
            <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToStatements();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ReceiptText className="h-3.5 w-3.5" />
                <span>View Full Statements in Audit Ledger →</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
