/**
 * ErrorBoundary — catches unhandled render-time errors and shows a clean
 * fallback UI instead of a blank white screen.
 *
 * Usage (in main.jsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production you could send this to Sentry / LogRocket
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Navigate to dashboard as a safe fallback
    window.location.href = '/dashboard'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
            <AlertTriangle size={36} className="text-danger" />
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted text-sm font-medium mb-8 leading-relaxed">
            An unexpected error occurred. Your data is safe — this is a display issue only.
          </p>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details className="text-left mb-6 rounded-xl border border-border bg-surface p-4 text-xs font-mono text-muted cursor-pointer">
              <summary className="font-semibold text-foreground mb-2 cursor-pointer">
                Error details
              </summary>
              <pre className="whitespace-pre-wrap break-all opacity-70 mt-2">
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
}
