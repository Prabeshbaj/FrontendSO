import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '@/theme/components'
import { useAuth } from './AuthProvider'

export function LoginCallback() {
  const { handleCallback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // StrictMode runs effects twice; the auth code is single-use.
    ran.current = true
    handleCallback()
      .then((to) => navigate(to, { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Sign-in failed'))
  }, [handleCallback, navigate])

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-9)' }}>
      {error ? <Alert tone="danger" title="Sign-in failed">{error}</Alert> : <p>Completing sign-in…</p>}
    </div>
  )
}
