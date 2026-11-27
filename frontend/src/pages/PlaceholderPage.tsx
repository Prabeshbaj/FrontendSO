import { PageHeader } from '@/theme/components'

export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return <PageHeader title={title} lead={text} />
}
