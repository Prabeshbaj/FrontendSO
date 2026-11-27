import { config } from '@/config'

/**
 * Loads the licensed brand font from an internal stylesheet URL, if configured.
 * No font files are bundled or committed. Without a URL, the Arial fallback renders.
 */
export function loadBrandFont(): void {
  const { cssUrl, family } = config.brandFont
  document.documentElement.style.setProperty('--font-brand', `'${family.replace(/'/g, '')}'`)
  if (!cssUrl) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
