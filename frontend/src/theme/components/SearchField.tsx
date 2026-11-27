import {
  Button as RACButton,
  Input,
  Label,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
} from 'react-aria-components'
import styles from './SearchField.module.css'

export interface SearchFieldProps extends Omit<RACSearchFieldProps, 'className' | 'style'> {
  label: string
  hideLabel?: boolean
  placeholder?: string
}

export function SearchField({ label, hideLabel, placeholder, ...props }: SearchFieldProps) {
  return (
    <RACSearchField {...props} className={styles.field}>
      <Label className={hideLabel ? 'visually-hidden' : styles.label}>{label}</Label>
      <div className={styles.control}>
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
          <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
        </svg>
        <Input className={styles.input} placeholder={placeholder} />
        <RACButton className={styles.clear} aria-label="Clear search">×</RACButton>
      </div>
    </RACSearchField>
  )
}
