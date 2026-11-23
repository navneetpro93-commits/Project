# FinGuard | Intelligent Banking & Security Management Platform

A modern, multi-threaded banking safety web platform featuring real-time fraud quarantine, atomic transaction isolation, MySQL persistence, multilingual translation, and full Light & Dark mode support.

---

## 🚀 Quick Start Guide (One-Click)

### 💻 On macOS / Linux:
Run the unified startup script from the root directory:
```bash
./start.sh
```
*(Or simply run `npm start`)*

### 🪟 On Windows:
Double-click `start.bat` or run in Command Prompt:
```cmd
start.bat
```

This automatically:
1. Compiles and starts the **Java API Server** on `http://localhost:8080`.
2. Starts the **React + Tailwind Frontend** on `http://localhost:5173`.
3. Opens your live banking application.

---

## 🌐 Running Frontend Standalone
If you or someone you shared the folder with only wants to run the frontend without Java or MySQL:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.
The platform includes an **Autonomous Engine Fallback** that seamlessly handles registration, sign-in, transfers, and security audits directly in the browser with **zero 502 errors**!

---

## 🔐 Key Features

### 1. Case-Insensitive Authentication
* **Create Account**: Register with any Username, Password, Name, and Opening Deposit.
* **Sign In**: Case-insensitive matching (`navneet` vs `Navneet` vs `NAVNEET` are identical).
* **Duplicate Detection**: Prevents duplicate usernames with immediate validation feedback.

### 2. Dual-Engine Persistence
* **MySQL Database**: Persists customers, accounts, and transactions to MySQL `finguard_db`.
* **Autonomous Fallback**: If MySQL or Java is unreachable, the app runs without error on client storage.

### 3. Banking Security Center
* **Cooldown Safety Vault**: Quarantines high-value transfers with an instant recall/cancel button.
* **Atomic Ledger Reconciliation**: Mathematical cross-checks confirming zero ledger drift.
* **Emergency Circuit Breaker**: Instant zero-latency account freeze and protection.
