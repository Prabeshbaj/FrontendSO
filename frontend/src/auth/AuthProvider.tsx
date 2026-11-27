import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { OktaAuth } from '@okta/okta-auth-js'
import { config } from '@/config'

export interface AuthUser {
  sub: string
  name?: string
  email?: string
}

interface AuthContextValue {
  isLoading: boolean
  isAuthenticated: boolean
  user: AuthUser | null
  signIn: (returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  /** Okta callback handling; used by the /login/callback route only. */
  handleCallback: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Okta OIDC authorization code flow with PKCE (D-05a). okta-auth-js uses PKCE by
 * default for SPAs. Tokens are kept in memory-backed session storage by the SDK.
 * Authorization is enforced by the API (CLAUDE.md rule 15), never by hiding UI.
 */
function createOkta() {
  return new OktaAuth({
    issuer: config.okta.issuer,
    clientId: config.okta.clientId,
    redirectUri: `${window.location.origin}/login/callback`,
    postLogoutRedirectUri: window.location.origin,
    scopes: config.okta.scopes,
    pkce: true,
    tokenManager: { storage: 'sessionStorage', autoRenew: true },
  })
}

function OktaAuthProvider({ children }: { children: React.ReactNode }) {
  const okta = useMemo(() => createOkta(), [])
  const [state, setState] = useState<{ isLoading: boolean; user: AuthUser | null }>({ isLoading: true, user: null })

  const refresh = useCallback(async () => {
    const authenticated = await okta.isAuthenticated()
    if (!authenticated) return setState({ isLoading: false, user: null })
    const id = await okta.tokenManager.get('idToken')
    const claims = id && 'claims' in id ? id.claims : undefined
    setState({
      isLoading: false,
      user: claims ? { sub: claims.sub, name: claims.name, email: claims.email } : null,
    })
  }, [okta])

  useEffect(() => {
    okta.start()
    void refresh()
    return () => void okta.stop()
  }, [okta, refresh])

  const value: AuthContextValue = {
    isLoading: state.isLoading,
    isAuthenticated: state.user !== null,
    user: state.user,
    signIn: async (returnTo = window.location.pathname + window.location.search) => {
      okta.setOriginalUri(returnTo)
      await okta.signInWithRedirect()
    },
    signOut: async () => {
      await okta.signOut()
    },
    getAccessToken: async () => (await okta.getAccessToken()) ?? null,
    handleCallback: async () => {
      await okta.handleLoginRedirect()
      await refresh()
      return okta.getOriginalUri() ?? '/'
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Local development only: synthetic user, no network. Blocked in production builds by config.ts. */
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>({ sub: 'mock-analyst', name: 'Test Analyst', email: 'analyst@example.test' })
  const value: AuthContextValue = {
    isLoading: false,
    isAuthenticated: user !== null,
    user,
    signIn: async () => setUser({ sub: 'mock-analyst', name: 'Test Analyst', email: 'analyst@example.test' }),
    signOut: async () => setUser(null),
    getAccessToken: async () => (user ? 'mock-token' : null),
    handleCallback: async () => '/',
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return config.authMode === 'mock' ? <MockAuthProvider>{children}</MockAuthProvider> : <OktaAuthProvider>{children}</OktaAuthProvider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
