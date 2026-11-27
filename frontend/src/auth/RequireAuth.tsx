import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Button } from '@/theme/components'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { isLoading, isAuthenticated, signIn } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) void signIn()
  }, [isLoading, isAuthenticated, signIn])

  if (isAuthenticated) return <Outlet />
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-9)', display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }}>
      <p>{isLoading ? 'Checking your session…' : 'Redirecting to sign in…'}</p>
      {!isLoading && <Button onPress={() => void signIn()}>Sign in with Okta</Button>}
    </div>
  )
}
