import {
  Button as RACButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as RACSelect,
  SelectValue,
  type Key,
} from 'react-aria-components'
import styles from './Select.module.css'

export interface SelectOption {
  id: string
  label: string
}

export interface SelectProps {
  label: string
  options: readonly SelectOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function Select({ label, options, value, onChange, placeholder = 'Any' }: SelectProps) {
  return (
    <RACSelect
      className={styles.select}
      value={value}
      onChange={(key: Key | null) => onChange(key == null ? null : String(key))}
      placeholder={placeholder}
    >
      <Label className={styles.label}>{label}</Label>
      <RACButton className={styles.trigger}>
        <SelectValue className={styles.value} />
        <span aria-hidden="true" className={styles.chevron}>▾</span>
      </RACButton>
      <Popover className={styles.popover}>
        <ListBox className={styles.listbox} items={options}>
          {(item) => (
            <ListBoxItem className={styles.option} id={item.id} textValue={item.label}>
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </RACSelect>
  )
}
