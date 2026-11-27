import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from './Button'
import styles from './AppShell.module.css'

const NAV = [
  { to: '/reviews', label: 'Reviews' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/uploads', label: 'Upload report' },
] as const

export function AppShell() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>Skip to main content</a>
      <header className={styles.header}>
        <div className={`container ${styles.bar}`}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            SOC Report Review
          </NavLink>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="visually-hidden">Menu</span>
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
          <nav id="primary-nav" aria-label="Primary" className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className={styles.user}>
              <span className={styles.userName}>{user?.name ?? user?.email}</span>
              <Button variant="secondary" size="sm" onPress={() => void signOut()}>Sign out</Button>
            </div>
          </nav>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container">Internal use only. The analyst makes every review decision.</div>
      </footer>
    </div>
  )
}
