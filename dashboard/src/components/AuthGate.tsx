import { useState, useEffect, createContext, useContext } from 'react'

const LogoutContext = createContext<(() => void) | null>(null)
export function useLogout() {
  return useContext(LogoutContext)
}

export function useAuthEmail() {
  return typeof window !== 'undefined'
    ? localStorage.getItem('kairo_email') ?? 'Parent'
    : 'Parent'
}

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setLoggedIn(localStorage.getItem('kairo_auth') === 'true')
    setChecking(false)
  }, [])

  function handleLogin(email: string) {
    localStorage.setItem('kairo_auth', 'true')
    localStorage.setItem('kairo_email', email)
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('kairo_auth')
    localStorage.removeItem('kairo_email')
    setLoggedIn(false)
  }

  if (checking) return null
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />
  return <LogoutContext.Provider value={handleLogout}>{children}</LogoutContext.Provider>
}

function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <form
        className="w-full max-w-xs space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (email && password) onLogin(email)
        }}
      >
        <div className="text-center space-y-2">
          <div className="font-mono text-[13px] font-semibold tracking-[0.3em] uppercase relative inline-block pl-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-app-orange rounded-[1px]" />
            KAIRO
          </div>
          <div className="mono text-app-muted">PARENT DASHBOARD</div>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-app-line-2 bg-app-surface text-sm text-app-ink placeholder:text-app-muted focus:outline-none focus:border-app-orange/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-app-line-2 bg-app-surface text-sm text-app-ink placeholder:text-app-muted focus:outline-none focus:border-app-orange/40 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-app-ink text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Sign in
        </button>

        <p className="text-center mono text-app-muted" style={{ fontSize: 9 }}>
          DEMO MODE — ANY CREDENTIALS
        </p>
      </form>
    </div>
  )
}
