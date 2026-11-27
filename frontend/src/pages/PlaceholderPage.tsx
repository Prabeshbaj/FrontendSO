export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="container" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <h1>{title}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>{text}</p>
    </div>
  )
}
