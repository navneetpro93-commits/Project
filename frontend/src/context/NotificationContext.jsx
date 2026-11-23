import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children, activeCustomer, overview }) {
  const customerId = activeCustomer?.id || 'guest';
  const storageKey = `finguard_notifications_${customerId}`;
  const seenKey = `finguard_seen_tx_${customerId}`;

  // State: List of notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State: Set of seen transaction IDs to avoid duplicate alerts
  const [seenTxIds, setSeenTxIds] = useState(() => {
    try {
      const saved = localStorage.getItem(seenKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Keep ref for synchronous checks in intervals
  const seenTxIdsRef = useRef(seenTxIds);
  seenTxIdsRef.current = seenTxIds;

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not save notifications to localStorage', e);
    }
  }, [notifications, storageKey]);

  // Persist seen transaction IDs
  useEffect(() => {
    try {
      localStorage.setItem(seenKey, JSON.stringify(Array.from(seenTxIds)));
    } catch (e) {
      console.warn('Could not save seenTxIds to localStorage', e);
    }
  }, [seenTxIds, seenKey]);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  // Add a single notification (e.g. from live payment actions or simulation)
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: notif.type, // 'RECEIVED' or 'DEBITED'
      title: notif.title,
      amount: notif.amount,
      account: notif.account,
      fromAccount: notif.fromAccount,
      toAccount: notif.toAccount,
      purpose: notif.purpose || 'Banking Transaction',
      category: notif.category || 'TRANSFER',
      status: notif.status || 'SUCCESS',
      timestamp: notif.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: notif.dateStr || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      tick: notif.tick,
      isRead: false,
      createdAt: Date.now()
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  // Mark all notifications as read (Turns heart back to normal heart!)
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove a single notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Auto-scan incoming transactions from overview to detect payments received / debited
  useEffect(() => {
    if (!activeCustomer || !overview?.transactions) return;

    // Get list of all account numbers belonging to this active customer
    const userAccountNumbers = new Set(
      (overview.accounts || [])
        .filter(a => a.customerId === activeCustomer.id)
        .map(a => a.number)
    );

    if (userAccountNumbers.size === 0) return;

    const currentSeen = seenTxIdsRef.current;
    const newSeen = new Set(currentSeen);
    const newNotifs = [];

    // Transactions come ordered newest first
    for (const tx of overview.transactions) {
      if (currentSeen.has(tx.id)) continue;
      newSeen.add(tx.id);

      const isIncoming = tx.toAccount && userAccountNumbers.has(tx.toAccount);
      const isOutgoing = tx.fromAccount && userAccountNumbers.has(tx.fromAccount);

      if (isIncoming && isOutgoing) {
        // Transfer between user's own accounts
        newNotifs.push({
          id: `tx_${tx.id}`,
          type: 'RECEIVED',
          title: `Internal Transfer • ₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          amount: tx.amount,
          account: tx.toAccount,
          fromAccount: tx.fromAccount,
          toAccount: tx.toAccount,
          purpose: tx.purpose || 'Self Account Transfer',
          category: tx.category || 'TRANSFER',
          status: tx.status,
          tick: tx.tick,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          isRead: false,
          createdAt: Date.now()
        });
      } else if (isIncoming) {
        // Payment received
        newNotifs.push({
          id: `tx_${tx.id}`,
          type: 'RECEIVED',
          title: `Payment Received • ₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          amount: tx.amount,
          account: tx.toAccount,
          fromAccount: tx.fromAccount || 'External / Cash Desk',
          toAccount: tx.toAccount,
          purpose: tx.purpose || `${tx.type} Received`,
          category: tx.category || tx.type,
          status: tx.status,
          tick: tx.tick,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          isRead: false,
          createdAt: Date.now()
        });
      } else if (isOutgoing) {
        // Payment debited
        newNotifs.push({
          id: `tx_${tx.id}`,
          type: 'DEBITED',
          title: `Payment Debited • ₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          amount: tx.amount,
          account: tx.fromAccount,
          fromAccount: tx.fromAccount,
          toAccount: tx.toAccount || 'Cash Desk / ATM',
          purpose: tx.purpose || `${tx.type} Debited`,
          category: tx.category || tx.type,
          status: tx.status,
          tick: tx.tick,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          isRead: false,
          createdAt: Date.now()
        });
      }
    }

    if (newNotifs.length > 0) {
      setSeenTxIds(newSeen);
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 50));
    }
  }, [overview?.transactions, activeCustomer]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        addNotification,
        markAllAsRead,
        markAsRead,
        clearAllNotifications,
        removeNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
