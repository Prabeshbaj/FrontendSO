# SOC Report Review Tool: frontend

React SPA for third-party risk analysts. They review what changed between a vendor's SOC
report and the prior year's, then sign off. The backend (Python, Step Functions, Textract,
Bedrock, DynamoDB, CloudFormation) lives in a separate repo: `<backend-repo>` (name TBD).

App code is in `frontend/`. Run every npm command from there.

## Read before working

| File | When |
|---|---|
| `docs/api-contract.md` | Any work that calls the API or changes a mock |
| `docs/testing.md` | Before writing or changing tests |
| `docs/frontend-stack-and-design-tokens.md` | Any UI or styling work |
| `docs/specs/T-xx-*.md` | The spec for the task you are on. Write one first (`/spec-task T-xx`) |
| `frontend/README.md` | Folder structure and env vars |

Requirements (FR-xx), architecture, `decisions.md` (D-xx, O-xx) and the task list (T-xx) live
in the backend repo's `docs/`. Decided items are binding. Never assume an answer to an Open
(O-xx) item: stop and ask. If docs disagree, stop and ask.

## Rules with no exceptions

1. **The analyst makes every decision.** No UI approves, rejects or scores a vendor. Claude's
   impact tag is always shown labelled "suggested"; the analyst sets the final value (D-08).
2. **Synthetic data only.** Mocks and fixtures use invented vendors and findings. Never add
   real SOC report text, vendor names, PDFs or screenshots of real reports (O-4).
3. **Authorization is enforced by the API**, not by hiding UI. Hiding a button is a courtesy.
4. **Every API response is parsed with its Zod schema** in `src/api/`. Never use unvalidated
   JSON. The schema mirrors `docs/api-contract.md`; change both in the same PR.
5. **Screens import UI only from `@/theme/components`.** Never import react-aria-components
   in `src/pages/`. All colours, spacing and type come from `src/theme/tokens.css`.
6. **Sign-in is Okta OIDC with PKCE** via okta-auth-js (D-05a). `VITE_AUTH_MODE=mock` must
   never work in a production build.
7. **No secrets, no font files, no `.env.local`** in git.
8. **AWS only** for hosting (S3 + CloudFront). Do not add third-party services or SDKs
   without a decision in `decisions.md`.

## Commands (from `frontend/`)

```sh
npm ci
npm run dev:mock      # MSW mock API + mock sign-in, no Okta needed
npm run lint          # oxlint
npm run typecheck     # tsc -b
npm test              # vitest run; use `npx vitest run <path>` for one file
npm run build
```

Done means `npm run lint && npm run typecheck && npm test && npm run build` all pass.

## How we work (one task = one branch = one PR)

1. `/clear`, then branch `t-xx-short-name` from `main`.
2. Plan mode: `/spec-task T-xx` writes `docs/specs/T-xx-*.md`. The human approves it.
3. Implement in a fresh session from the spec: tests first, then code, then the Done checks.
4. Show evidence: command output, and a screenshot at 1366 and 390 wide for UI changes.
5. Review: run the `spec-reviewer` agent, then `/code-review`.
6. PR uses `.github/pull_request_template.md`: task ID, FR IDs, decisions touched.
7. If you make a mistake a rule would have prevented, propose the rule for this file.
