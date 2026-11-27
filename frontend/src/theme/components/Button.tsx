import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'text'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends Omit<RACButtonProps, 'className' | 'style'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Pill button matching the reference site: solid ink, outline ink, brand red, or text. */
export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <RACButton {...props} className={`${styles.button} ${styles[variant]} ${styles[size]}`} />
}
