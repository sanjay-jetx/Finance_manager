import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Receivables from './pages/Receivables'
import Wallets from './pages/Wallets'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Metals from './pages/Metals'
import Subscriptions from './pages/Subscriptions'
import Profile from './pages/Profile'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { isAuth } = useAuth()
  return isAuth ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuth } = useAuth()
  return !isAuth ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budgets"      element={<Budgets />} />
            <Route path="goals"        element={<Goals />} />
            <Route path="receivables" element={<Receivables />} />
            <Route path="lending" element={<Navigate to="/receivables" replace />} />
            <Route path="wallets"      element={<Wallets />} />
            <Route path="metals"       element={<Metals />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="profile"       element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
