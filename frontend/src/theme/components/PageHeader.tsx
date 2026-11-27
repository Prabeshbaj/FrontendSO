import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
  lead?: string
  actions?: React.ReactNode
}

/** Full-width dark band with white heading, matching the reference site's dark sections. */
export function PageHeader({ title, lead, actions }: PageHeaderProps) {
  return (
    <div className={styles.band}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  )
}
