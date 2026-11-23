// FinGuard Client API connecting React Frontend to Java Backend Server (Port 8080)
// Guarantees real persistence in local MySQL database (finguard_db).

const PRIMARY_URL = import.meta.env.VITE_API_URL || '/api';
const DIRECT_JAVA_URL = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:8080/api`
  : 'http://localhost:8080/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // 1. Try Primary URL (Vite proxy /api -> http://localhost:8080)
  try {
    const res = await fetch(`${PRIMARY_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 502 || res.status === 504) {
      throw new Error(`Java backend on port 8080 is not reachable (502).`);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server returned error (${res.status})`);
    }
    return data;
  } catch (err) {
    // If it's a backend validation error (e.g. wrong password or duplicate username), rethrow immediately
    if (err.message && !err.message.includes('502') && !err.message.includes('not reachable') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }

    // 2. Direct fallback to http://localhost:8080/api (bypassing Vite proxy)
    try {
      const directRes = await fetch(`${DIRECT_JAVA_URL}${path}`, {
        ...options,
        headers,
      });

      const directData = await directRes.json().catch(() => ({}));
      if (!directRes.ok) {
        throw new Error(directData.error || `Java Server error (${directRes.status})`);
      }
      return directData;
    } catch (directErr) {
      if (directErr.message && !directErr.message.includes('Failed to fetch') && !directErr.message.includes('NetworkError')) {
        throw directErr;
      }
      throw new Error('Java backend server is not running on port 8080. Please start the Java server (run `./start.sh` or `npm start`) to connect to MySQL database.');
    }
  }
}

export const api = {
  // Health & Heartbeat
  getHealth: () => request('/health'),
  getOverview: () => request('/overview'),
  getTransactions: () => request('/transactions'),
  getNotifications: () => request('/notifications'),

  // Authentication & Customers
  login: (username, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, customerId: username, pin: password }),
    }),

  register: ({ username, password, name, accountType, deposit }) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        name: name || username,
        accountType: accountType || 'SAVINGS',
        deposit: Number(deposit) || 10000,
      }),
    }),

  createCustomer: (name, pin) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    }),

  createAccount: (customerId, type, opening) =>
    request('/accounts', {
      method: 'POST',
      body: JSON.stringify({ customerId, type, opening: Number(opening) }),
    }),

  // Transactions & Clearing
  move: ({ type, fromAccount, toAccount, amount, purpose }) =>
    request('/move', {
      method: 'POST',
      body: JSON.stringify({
        type: (type || '').toUpperCase(),
        fromAccount: fromAccount || '',
        toAccount: toAccount || '',
        amount: Number(amount),
        purpose: purpose || 'General Banking',
      }),
    }),

  // Ledgers & Intelligence
  getStatement: (account, sort = 'date') =>
    request(`/statement?account=${encodeURIComponent(account)}&sort=${encodeURIComponent(sort)}`),

  getSpending: (account) =>
    request(`/spending?account=${encodeURIComponent(account)}`),

  // Budget Management
  getBudget: (account) =>
    request(`/budget?account=${encodeURIComponent(account)}`),

  updateBudget: ({ customerId, account, category, amount, budgets }) =>
    request('/budget', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        account,
        category,
        amount: amount !== undefined ? Number(amount) : undefined,
        budgets,
      }),
    }),

  // Security & Locks
  freeze: (account, pin) =>
    request('/freeze', {
      method: 'POST',
      body: JSON.stringify({ account, pin }),
    }),

  unfreeze: (account, pin, phrase = 'UNFREEZE') =>
    request('/unfreeze', {
      method: 'POST',
      body: JSON.stringify({ account, pin, phrase }),
    }),

  cancelCooldown: (id) =>
    request('/cooldown/cancel', {
      method: 'POST',
      body: JSON.stringify({ id: Number(id) }),
    }),

  // Stress & Concurrency Labs
  runRaceLab: () => request('/labs/race', { method: 'POST' }),
  runPriorityLab: () => request('/labs/priority', { method: 'POST' }),
  runFreezeLab: () => request('/labs/freeze', { method: 'POST' }),

  // Database Status
  getDbStatus: () => request('/db/status'),
};
