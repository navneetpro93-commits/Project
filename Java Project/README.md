# FinGuard | Intelligent Banking Safety Console & Concurrency Lab

A modern, multi-threaded banking safety web platform with automated fraud prevention, real-time stress testing, multi-language translation via API, and full Light & Dark mode support.

---

## 🚀 Quick Start Guide

### 1. Start the Java Backend Server (Port 8080)
From the project root:
```bash
# Compile all Java sources
javac -d . finguard/api/*.java finguard/*.java finguard/*/*.java

# Run the API server
java finguard.api.ApiMain
```
The Java server starts an embedded HTTP server on `http://localhost:8080`, initializes the daemon `BankClock`, `CooldownVault` watcher, and `SettlementWorker` threads, and seeds demo data:
* **C101 (Navneet)**: PIN `1234` | Accounts: `FG1001` (Savings, ₹100,000) & `FG1002` (Current, ₹25,000)
* **C102 (Aarav)**: PIN `2345` | Account: `FG1003` (Savings, ₹40,000)
* **C103 (Meera)**: PIN `3456` | Account: `FG1004` (Savings, ₹15,000)

---

### 2. Start the React + Tailwind Frontend (Port 5173)
In another terminal tab:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🌟 New Features

### 🌐 1. Multilingual Support (via Translation API)
Switch languages anytime directly from the top navigation:
* 🇺🇸 **English** (`en`)
* 🇮🇳 **हिन्दी** (`hi`)
* 🇪🇸 **Español** (`es`)
* 🇫🇷 **Français** (`fr`)
* 🇩🇪 **Deutsch** (`de`)

Includes high-speed zero-latency dictionary caches plus on-demand dynamic API translation fetching via the open translation API.

---

### 🌓 2. White (Light) & Dark Theme
Toggle between crisp **White Mode** and sleek **Dark Fintech Mode** using the Sun/Moon toggle button. All dashboards, cards, tables, modals, and terminals automatically adjust with seamless transitions.

---

### 🔐 3. Authentication & Profile Sessions
* **Sign In**: Customer ID + Security PIN.
* **Sign Up**: Full Legal Name, Security PIN, Account Type selection, and initial deposit.
* **Instant Demo Logins**: 1-Click access for Navneet, Aarav, and Meera.
* **Sign Out**: Profile dropdown menu with persistent session storage.
