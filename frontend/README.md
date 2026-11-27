# SOC Report Review: frontend

React 19 + TypeScript 7 + Vite 8 SPA, deployed to S3 + CloudFront (architecture-v2).
Design tokens measured from investor.vanguard.com; see `src/theme/tokens.css`.

## Run

```sh
npm ci
npm run dev:mock     # synthetic data, mock sign-in, MSW mock API. No Okta needed.
npm run dev          # real Okta + API. Copy .env.example to .env.local first.
npm run typecheck && npm test && npm run build
```

`VITE_AUTH_MODE=mock` is rejected in production builds (`src/config.ts`).

## Structure

```
src/
  theme/            ALL visual decisions live here
    tokens.css      colours, type scale, spacing, radii, breakpoints
    fonts.ts        loads licensed brand font from VITE_BRAND_FONT_CSS_URL (nothing committed)
    components/     Button, SearchField, Select, DataTable, Pagination, StatusBadge, Alert, AppShell
  auth/             Okta OIDC + PKCE (okta-auth-js), RequireAuth, /login/callback
  api/              fetch client with bearer token, Zod-validated responses, TanStack Query hooks
  mocks/            MSW handlers and SYNTHETIC data only
  pages/            screens; import UI only from @/theme/components
```

## Swapping in the internal UI library

Screens never import react-aria-components directly. Reimplement each wrapper in
`src/theme/components` on top of the internal library (keep the props), then map or delete
`tokens.css`. No screen code should change.

## Assumptions and open points

- `GET /reviews` contract in `src/api/reviews.ts` is assumed; architecture-v2 does not define routes yet.
- Okta issuer, audience and group claim are open (O-12). Roles are enforced by the API, not the UI.
- Status colours are placeholders: the reference page had none. Take them from the internal library.
- Brand font URL is not known yet; the app renders in Arial until `VITE_BRAND_FONT_CSS_URL` is set.
- Main bundle is ~810 KB minified (~250 KB gzip), mostly okta-auth-js. Route-level code splitting is a follow-up.

Use synthetic data only. Do not add real SOC reports or vendor details to this repo (O-4).
