# 💰 FinTrack — Personal Finance Manager

> A full-stack personal finance application with **FastAPI** backend, **React** frontend, **MongoDB Atlas** database, and **Google OAuth** login. Tracks wallets, income, expenses, goals, budgets, lending, receivables, and live gold/silver prices.

---

## 🗂️ Project Structure

```
Finance_app/
├── backend/                    ← FastAPI (Python 3.11+)
│   ├── main.py                 ← App entry point, middleware, router registration
│   ├── requirements.txt        ← Python dependencies
│   ├── .env                    ← Secret config (never commit this!)
│   ├── database/
│   │   └── connection.py       ← MongoDB Atlas async connection
│   ├── routers/
│   │   ├── auth.py             ← Signup, Login, Google OAuth, Refresh, Logout
│   │   ├── transactions.py     ← Income, Expense, Delete, Export CSV
│   │   ├── wallets.py          ← Balance fetch, Cash/UPI transfer
│   │   ├── dashboard.py        ← All-in-one dashboard data aggregation
│   │   ├── goals.py            ← Savings goals CRUD + atomic fund transfer
│   │   ├── budgets.py          ← Monthly budget limits per category
│   │   ├── debts.py            ← Lending and receivables tracker
│   │   ├── categories.py       ← Custom expense categories
│   │   └── metals.py           ← Live gold/silver tracker (no API key needed)
│   ├── services/
│   │   ├── auth_service.py     ← bcrypt hashing, Google token verify
│   │   ├── wallet_service.py   ← Atomic wallet debit/credit operations
│   │   └── token_service.py    ← JWT issue, verify, blacklist
│   ├── schemas/                ← Pydantic request/response models
│   └── tests/                  ← pytest async test suite
│
├── frontend/                   ← React 18 + Vite + TailwindCSS
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx        ← Aurora split-screen login
│       │   ├── Signup.jsx       ← Signup with live password strength meter
│       │   ├── Dashboard.jsx    ← Main dashboard (charts, stats, quick-add)
│       │   ├── Transactions.jsx ← Full transaction list + filters + export
│       │   ├── Wallets.jsx      ← Wallet balances + transfer
│       │   ├── Goals.jsx        ← Savings goals with circular progress
│       │   ├── Budgets.jsx      ← Budget management
│       │   ├── Receivables.jsx  ← Lending/receivables tracker
│       │   └── Metals.jsx       ← Gold & silver live tracker
│       ├── components/
│       │   ├── Layout.jsx       ← Sidebar navigation + mobile header
│       │   └── WalletPicker.jsx ← Reusable wallet selection
│       ├── context/
│       │   └── AuthContext.jsx  ← JWT state + proactive token refresh
│       ├── api/
│       │   └── axios.js         ← Axios instance + interceptors (auto-refresh)
│       └── utils/
│           ├── format.js        ← INR currency formatter
│           └── transactionsUi.js
│
├── start_backend.bat           ← One-click backend launch (Windows)
└── start_frontend.bat          ← One-click frontend launch (Windows)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.111, Python 3.11+ |
| Database | MongoDB Atlas (async via Motor) |
| Auth | JWT (python-jose) + bcrypt + Google OAuth |
| HTTP Client | httpx (async external API calls) |
| Rate Limiting | SlowAPI |
| Frontend | React 18, Vite, TailwindCSS |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | react-hot-toast |
| Frontend HTTP | Axios (with interceptors) |

---

## 🔑 Environment Setup

We have an interactive setup script that will generate your JWT secrets and configure your `.env` files automatically.

You just need to gather two things first:
1. **MongoDB Atlas URL** — get a free cluster from [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Google Client ID** (*optional*) — from [console.cloud.google.com](https://console.cloud.google.com) 

Once you have those, run:
```bash
python setup_env.py
```
This will prompt you for the IDs and automatically create `backend/.env` and `frontend/.env.local`.

> Never commit `.env` or `.env.local` — both are in `.gitignore`.

---

## 🚀 Running Locally

### Windows (Quick Start)
```bat
:: Terminal 1
start_backend.bat

:: Terminal 2
start_frontend.bat
```

### Manual
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📡 API Endpoints

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/signup` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/google` | Public |
| POST | `/auth/refresh` | Cookie |
| POST | `/auth/logout` | Bearer |

### Core (All require `Authorization: Bearer <token>`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Full dashboard stats |
| GET | `/balances` | Wallet balances |
| POST | `/transfer` | Cash / UPI transfer |
| POST | `/income` | Record income |
| POST | `/expense` | Record expense |
| GET | `/transactions` | List + filter transactions |
| DELETE | `/transactions/{id}` | Delete + reverse balance |
| GET | `/transactions/export` | Download CSV |
| GET/POST | `/goals` | List/create goals |
| POST | `/goals/{id}/add-funds` | Fund a goal |
| GET/POST/DELETE | `/budgets` | Budget CRUD |
| GET/POST | `/debts` | Lending records |
| PATCH | `/debts/{id}/return` | Mark money returned |
| GET | `/metals/rates` | Live gold & silver rates |
| GET/POST | `/metals/holdings` | User's metal holdings |
| GET | `/metals/portfolio` | Holdings × rates = value |

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Accounts (email, bcrypt password, name) |
| `wallets` | Cash + UPI balances |
| `transactions` | All financial records |
| `debts` | Lending & receivables |
| `goals` | Savings goals |
| `budgets` | Category limits |
| `categories` | Custom expense categories |
| `metal_holdings` | Gold/silver grams per user |
| `metal_rates` | Global cached live rates (24h) |

---

## 🔐 Security

- **Passwords** — bcrypt (cost 12)
- **Access tokens** — JWT, 15-minute expiry
- **Refresh tokens** — JWT, 7-day, HTTP-only cookie (XSS-proof)
- **Auto-refresh** — Axios intercepts 401 → calls `/auth/refresh` → retries
- **Wallet safety** — All debits use MongoDB `$inc` + `$cond` (atomic, no race conditions)
- **Rate limiting** — Auth endpoints protected via SlowAPI

---

## 🧪 Tests

```bash
cd backend
pytest -v
```

Uses `mongomock-motor` — no real database needed. Tests are isolated (auto-teardown).

---

## ✨ Features

| | Feature |
|-|---------|
| ✅ | Email + Google OAuth login |
| ✅ | JWT dual-token auth system |
| ✅ | Cash + UPI wallets + atomic transfers |
| ✅ | Income & expense tracking |
| ✅ | Transaction filters + CSV export |
| ✅ | Savings goals with progress rings |
| ✅ | Monthly budget limits + 80% alerts |
| ✅ | Lending & receivables tracker |
| ✅ | Live gold/silver INR rates (no API key) |
| ✅ | Dashboard: net worth, savings rate, charts |
| ✅ | Quick-add FAB button |
| ✅ | Aurora dark theme, glassmorphism UI |
| ✅ | Mobile responsive |

---

## 👤 New Developer Quickstart

1. Clone the repo
2. Run `pip install -r requirements.txt` in `/backend`
3. Run `npm install` in `/frontend`
4. Run `python setup_env.py` in the root folder to configure your environment variables.
5. Double-click `start_backend.bat` and `start_frontend.bat` to launch!

MongoDB Atlas is cloud-hosted — no local DB setup needed.

---

*FinTrack v2.0 · FastAPI + React + MongoDB Atlas*
