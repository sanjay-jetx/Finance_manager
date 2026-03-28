# 💰 FinTrack — Personal Finance Manager

A production-ready full-stack personal finance app to track Cash, UPI wallets, expenses, income, and debts.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | FastAPI (Python) |
| Database | MongoDB (Motor async driver) |
| Auth     | JWT (python-jose + bcrypt) |

---

## ✨ Features

- 🔐 **JWT Auth** — Secure signup/login with token-based sessions
- 💵 **Dual Wallet** — Separate Cash & UPI balances with real-time tracking
- 📊 **Dashboard** — Stats, weekly spending chart, category breakdown
- 💸 **Expense Tracking** — Categorized, per-wallet expenses
- 💰 **Income Tracking** — Record income with source
- 🤝 **Debt Tracker** — Lend money, track returns, overdue alerts
- 🔄 **Wallet Transfer** — Move money between Cash ↔ UPI
- 🌙 **Dark Mode** — Beautiful dark glassmorphism UI
- 📱 **Mobile Responsive** — Works on all screen sizes

---

## 📦 Project Structure

```
Finance_app/
├── backend/
│   ├── main.py               # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── .env                  # Environment variables
│   ├── database/connection.py
│   ├── routers/
│   │   ├── auth.py           # POST /signup, POST /login
│   │   ├── transactions.py   # POST /expense, /income, /transfer, GET /transactions
│   │   ├── debts.py          # POST /lend, PATCH /return/{id}, GET /debts
│   │   ├── wallets.py        # GET /balances
│   │   └── dashboard.py      # GET /dashboard
│   ├── schemas/              # Pydantic request/response models
│   └── services/             # Business logic (auth, wallet)
└── frontend/
    ├── src/
    │   ├── pages/            # Dashboard, Transactions, Debts, Wallets
    │   ├── components/       # Layout, Navbar
    │   ├── context/          # AuthContext (JWT state)
    │   └── api/axios.js      # API client with JWT interceptor
    └── package.json
```

---

## 🛠️ Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally on port 27017

### 1. Start Backend
```bash
# Option A: Use the batch script (Windows)
start_backend.bat

# Option B: Manual
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
Swagger docs at: **http://localhost:8000/docs**

### 2. Start Frontend
```bash
# Option A: Use the batch script (Windows)
start_frontend.bat

# Option B: Manual
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, get JWT |
| POST | `/expense` | ✅ | Add expense |
| POST | `/income` | ✅ | Add income |
| GET  | `/transactions` | ✅ | List transactions |
| POST | `/transfer` | ✅ | Transfer between wallets |
| POST | `/lend` | ✅ | Lend money |
| PATCH | `/return/{id}` | ✅ | Mark debt returned |
| GET  | `/debts` | ✅ | List debts |
| GET  | `/balances` | ✅ | Get wallet balances |
| GET  | `/dashboard` | ✅ | Full dashboard stats |

---

## 🗄️ MongoDB Collections

- **users** — `{name, email, hashed_password}`
- **wallets** — `{user_id, cash_balance, upi_balance}`
- **transactions** — `{user_id, type, amount, category, wallet, before_balance, after_balance, timestamp}`
- **debts** — `{user_id, person_name, amount, wallet, given_date, return_date, status}`
