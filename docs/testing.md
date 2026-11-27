# Frontend testing

| Layer | Tool | Where | Rule |
|---|---|---|---|
| Pure logic (URL params, formatting) | Vitest | `*.test.ts` next to the file | No DOM, no network |
| Components and pages | Vitest + Testing Library + user-event | `*.test.tsx` next to the page | Query by role and label, not class names |
| API | MSW handlers in `src/mocks/` | shared by tests and `dev:mock` | Responses must pass the Zod schemas |
| Visual check | Screenshot at 1366 and 390 wide | PR description | Required for UI changes |
| End to end on dev | Synthetic report pair only | T-31 | Never real reports (O-4) |

Rules:

- Each FR a task covers gets at least one test that names it, for example
  `it('FR-16: sign-off stays disabled until every row is actioned')`.
- Test the states the API can return: loading, empty, error (401, 403, 409, 500), and each
  report status.
- The "suggested" label on impact tags must be asserted wherever the tag renders (D-08).
- Mock data is invented. No real vendor names or report text.
- Run one file while iterating (`npx vitest run src/pages/reviews`), the full suite before PR.
