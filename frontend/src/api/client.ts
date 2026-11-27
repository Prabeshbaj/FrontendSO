import type { z } from 'zod'
import { config } from '@/config'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type TokenGetter = () => Promise<string | null>

/** Fetch JSON from the API with the Okta access token, and validate the response with Zod. */
export async function apiGet<S extends z.ZodType>(
  path: string,
  schema: S,
  getToken: TokenGetter,
  init?: { signal?: AbortSignal },
): Promise<z.infer<S>> {
  const token = await getToken()
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    signal: init?.signal,
  })
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`)
  return schema.parse(await res.json())
}
