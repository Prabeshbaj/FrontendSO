import { z } from 'zod'

const EnvSchema = z.object({
  VITE_AUTH_MODE: z.enum(['okta', 'mock']).default('okta'),
  VITE_OKTA_ISSUER: z.string().default(''),
  VITE_OKTA_CLIENT_ID: z.string().default(''),
  VITE_OKTA_SCOPES: z.string().default('openid profile email'),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_BRAND_FONT_CSS_URL: z.string().default(''),
  VITE_BRAND_FONT_FAMILY: z.string().default('FF Mark'),
})

const env = EnvSchema.parse(import.meta.env)

if (env.VITE_AUTH_MODE === 'mock' && import.meta.env.PROD) {
  throw new Error('VITE_AUTH_MODE=mock is not allowed in a production build')
}

export const config = {
  authMode: env.VITE_AUTH_MODE,
  okta: {
    issuer: env.VITE_OKTA_ISSUER,
    clientId: env.VITE_OKTA_CLIENT_ID,
    scopes: env.VITE_OKTA_SCOPES.split(/\s+/).filter(Boolean),
  },
  apiBaseUrl: env.VITE_API_BASE_URL.replace(/\/$/, ''),
  brandFont: {
    cssUrl: env.VITE_BRAND_FONT_CSS_URL,
    family: env.VITE_BRAND_FONT_FAMILY,
  },
} as const
