import styles from './StatusBadge.module.css'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
