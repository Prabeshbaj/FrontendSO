import styles from './Alert.module.css'

export function Alert({ tone = 'info', title, children }: { tone?: 'info' | 'danger'; title: string; children?: React.ReactNode }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`${styles.alert} ${styles[tone]}`}>
      <p className={styles.title}>{title}</p>
      {children && <div>{children}</div>}
    </div>
  )
}
