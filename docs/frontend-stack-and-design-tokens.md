# Frontend stack and design tokens

Draft, 2026-11-27. For the React + TypeScript (Vite) SPA on S3 + CloudFront (architecture-v2, CLAUDE.md).
Versions checked against the npm registry on 2026-11-27. Design values measured from the computed
styles of https://investor.vanguard.com/ at a 1303px viewport on 2026-11-27 (home page only).

## 1. Library recommendations

Principle: keep every visual decision in one theme layer (CSS variables + a thin component wrapper),
so the internal Vanguard UI library can replace it later without touching screens.

| Need | Recommendation | Version | Why | Alternative |
| --- | --- | --- | --- | --- |
| Build | Vite + React + TypeScript | vite 8.4.0, react 19.3.1, typescript 7.0.2 | Already decided in CLAUDE.md | — |
| UI primitives | React Aria Components (headless) styled with CSS Modules + token variables | react-aria-components 1.22.1 | Accessible behaviour (focus, keyboard, ARIA) with zero imposed look, so the brand look is ours and swappable | MUI 9.6.0 with a custom theme: faster start, but its look and API leak into every screen and make the later swap costly |
| Data grid / tables | TanStack Table (headless) | @tanstack/react-table 9.3.1 | Sorting, filtering, column visibility, server-side pagination; renders our own markup | AG Grid Community 36.3.0 if you need Excel-like grids with virtualised 10k+ rows |
| Search | Server-side search through the API (FR-19), driven by TanStack Query + debounced input + filters kept in the URL | — | Results are shareable and back-button safe; the API enforces authorization | cmdk 1.1.1 for a Ctrl+K quick-jump palette; fuse.js 7.5.0 for client-side fuzzy match on small lists such as vendor names |
| Server state | TanStack Query | @tanstack/react-query 5.108.4 | Caching, retries, polling of pipeline status | — |
| Client state | React state + URL params; Zustand only if needed | zustand 5.1.0 | Most state is server state | — |
| Routing | React Router (library mode) | react-router 8.5.3 | Familiar, stable | TanStack Router 1.170.46 for fully typed routes and search params |
| Forms / validation | React Hook Form + Zod | react-hook-form 7.92.0, zod 4.6.7 | Share Zod schemas with API response parsing | — |
| Auth (Okta, D-05a) | `@okta/okta-auth-js` used directly with a small React context | 8.0.1 | Auth code + PKCE is its default for SPAs. `@okta/okta-react` 6.11.0 still lists `react-router-dom` as a peer, which no longer matches React Router 8 | `oidc-client-ts` 3.5.0 + `react-oidc-context` 3.3.1 (vendor-neutral) |
| PDF evidence pane | react-pdf (pdf.js) | react-pdf 11.1.0, pdfjs-dist 6.5.438 | Side-by-side cited page view; host the worker in our own bucket, no CDN | — |
| Unit / component tests | Vitest + Testing Library + MSW | vitest 5.1.2, @testing-library/react 16.3.3, msw 3.0.8 | Fast, Vite-native; MSW mocks the API with synthetic data | — |
| E2E + accessibility | Playwright + axe | @playwright/test 1.65.1, @axe-core/playwright 4.14.1 | Runs in CodeBuild; axe fails the build on WCAG violations | — |

Unverified: I have not installed these together. Check peer ranges on install (React 19.3, TS 7).

## 2. Design tokens (measured)

### Typography

- Font family: **FF Mark** (licensed). Weights loaded on the page: 400, 700, 800 (900 used on some h3).
  Also declared: FF Mark Narrow, Thorndale (serif). Fallback stack on the site: `Arial, sans-serif`.
- Do not commit font files. Load them from the internal library or an internal font host by config
  (see section 3). Until then the fallback stack renders.

| Token | Size / line height | Weight | Letter spacing | Seen on |
| --- | --- | --- | --- | --- |
| display | 92 / 96 | 800 | -2px | hero h1 |
| h1 | 68 / 72 | 800 | — | section headline |
| h2 | 57 / 64 | 800 | -0.5px | banner h2 |
| h3 | 46 / 48 | 800 | — | |
| h4 | 34 / 40 | 800 | — | card group titles |
| h5 | 28 / 32 | 800–900 | — | card titles |
| lead | 23 / 32 | 400 | — | intro copy |
| body | 17 / 24 | 400 (700 for emphasis/links) | — | default text |
| small | 14 / 20 | 400 / 700 | — | nav, meta |
| caption | 11 / 20 | 700 | — | eyebrow labels |

For a data-dense analyst tool, use the same family and weights but cap screen headings at h4 (34px)
and use 14–15px body in tables. That is my suggestion, not taken from the site.

### Colour

| Token | Value | Use on site |
| --- | --- | --- |
| ink | `#040505` | primary text, primary button fill, dark bands |
| text-body | `#1A1A1A` | paragraph text |
| text-muted | `#717777` | secondary text |
| text-subtle | `#555555` | |
| surface | `#FFFFFF` | page |
| surface-alt | `#F5F6F6` | alternating sections, cards |
| surface-dark-2 | `#3F4444` | dark secondary |
| border | `#E8E9E9` (2px) | dividers, card borders |
| brand-red | `#C20029` | "Log in" button (brand accent, use sparingly) |
| link / interactive | `#145BFF` | links, interactive text |
| info | `#0071DE` | info blue |
| info-surface | `#E6F1FC` | info banners |
| overlay | `rgba(0,0,0,0.5)` | modal scrim |

Status colours for findings (success, warning, error) were not on the home page. Take them from the
internal library; do not invent them for production. Check text contrast with axe either way.

### Shape, elevation, spacing, layout

- Buttons: pill, `border-radius: 80px`, 2px border, height 68px (hero) / 48px (secondary), 17px text.
  Variants seen: solid ink, outline ink, solid brand red, text-only.
- Cards / chips: `border-radius: 32px`; icon buttons: circle (50%).
- Shadow (cards): `0 1px 1px rgba(4,5,5,.18), 0 0 4px 1px rgba(4,5,5,.06)`.
- Spacing values used most: 4, 8, 12, 16, 24, 32, 56, 112px. Suggested scale: 4, 8, 12, 16, 24, 32, 48, 56, 80, 112.
- Container max width: 1140px; narrow text column 730px.
- Breakpoints (Bootstrap-style, from the site's media queries): sm 576, md 768, lg 992, xl 1200, xxl 1400.

## 3. Theme layer (how to keep it swappable)

```
frontend/src/theme/
  tokens.css      # :root { --color-ink: #040505; --font-sans: var(--brand-font, Arial), sans-serif; ... }
  fonts.ts        # injects @font-face from VITE_BRAND_FONT_CSS_URL if set; nothing committed
  components/     # Button, TextField, Table, Dialog... wrap React Aria; screens import only these
```

Screens import `@/theme/components` only. When the internal library is adopted, reimplement those
wrappers on top of it (or re-export its components) and delete `tokens.css`.

## 4. Open points (do not assume)

- Is the internal Vanguard UI library React, and is it published to an internal npm registry the
  CodeBuild pipeline can reach? This decides whether to start on it now instead of React Aria.
- Where the licensed FF Mark files are hosted internally (URL for `VITE_BRAND_FONT_CSS_URL`).
- Search backend for FR-19 beyond vendor-name lookup (DynamoDB GSI in architecture-v2). Not decided.

Reminder: use synthetic data only. Do not upload real SOC reports until InfoSec and Legal approve (O-4).
