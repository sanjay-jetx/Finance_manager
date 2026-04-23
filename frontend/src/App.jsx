import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Receivables = lazy(() => import('./pages/Receivables'))
const Wallets = lazy(() => import('./pages/Wallets'))
const Metals = lazy(() => import('./pages/Metals'))
const Stocks = lazy(() => import('./pages/Stocks'))
const Profile = lazy(() => import('./pages/Profile'))
const Layout = lazy(() => import('./components/Layout'))

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-10 h-10 border-[3px] border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  )
}

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
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0E0F13',
              color: '#F5F5F7',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '600',
              letterSpacing: '0.04em',
              padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
              maxWidth: '360px',
            },
            success: {
              iconTheme: { primary: '#00FFA3', secondary: '#020305' },
              style: { borderLeft: '2px solid #00FFA3' },
            },
            error: {
              iconTheme: { primary: '#FF3366', secondary: '#fff' },
              style: { borderLeft: '2px solid #FF3366' },
            },
          }}
        />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"      element={<Dashboard />} />
              <Route path="transactions"   element={<Transactions />} />
              <Route path="receivables"    element={<Receivables />} />
              <Route path="lending"        element={<Navigate to="/receivables" replace />} />
              <Route path="wallets"        element={<Wallets />} />
              <Route path="stocks"         element={<Stocks />} />
              <Route path="metals"         element={<Metals />} />
              <Route path="profile"        element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
