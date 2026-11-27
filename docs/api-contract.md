# API contract (draft)

The contract between this SPA and the backend API Lambda. The backend repo implements it;
this file and the Zod schemas in `frontend/src/api/` must match. Change both in the same PR,
and open the matching backend change.

Status: **draft**. Only `GET /reviews` is used today, and it is an assumption: architecture-v2
does not define routes yet. Routes below that are not built are marked *planned* and follow
`implementation-plan.md` tasks T-21 to T-26.

## Conventions

- Base URL: `VITE_API_BASE_URL` (default `/api`).
- Auth: `Authorization: Bearer <Okta access token>`. 401 when missing or invalid, 403 when the
  role is not allowed. Roles come from an Okta group claim (claim name open, O-12).
- JSON, camelCase properties. Dates are ISO `YYYY-MM-DD`; timestamps are ISO 8601 UTC.
- Lists return `{ items, total, page, pageSize }`. `page` starts at 1.
- Errors: `{ "message": string }` with 400, 401, 403, 404 or 409.

## Report status lifecycle

From architecture-v2 §3. Sign-off is by one analyst (D-28); there is no manager review step.

```
UPLOADING -> EXTRACTING -> EXTRACTED -> COMPARING -> READY_FOR_REVIEW -> SIGNED_OFF
                                    \-> NO_PRIOR (single-report summary only)
any step -> FAILED (with a reason; never shown as partial)
```

Sign-off: one analyst signs off once every change has an analyst action (FR-16, D-28). The
API returns 409 otherwise and records `signedOffBy` and the time. `SIGNED_OFF` is final; no
`MANAGER_REVIEW` state exists. The tool still records no vendor decision (D-08).

## Routes

| Method and path | Purpose | Task | State |
|---|---|---|---|
| `GET /reviews?q&status&reportType&year&sort&dir&page&pageSize` | Search reviews (FR-19) | T-23 | Used by UI, mocked, assumed |
| `GET /vendors`, `POST /vendors`, `GET/PUT /vendors/{vendorId}` | Vendor CRUD | T-21 | Planned |
| `POST /reports` | Create report item, return presigned PUT URL (PDF only) | T-22 | Planned |
| `GET /reports/{reportId}` | Report status and metadata | T-23 | Planned |
| `GET /reports/{reportId}/comparison` | Diff with page refs for both years | T-23 | Planned |
| `GET /reports/{reportId}/pdf` | Presigned GET for the PDF | T-23 | Planned |
| `POST /reports/{reportId}/changes/{changeId}/actions` | Confirm, edit or reject; final impact; comment | T-24 | Planned |
| `POST /reports/{reportId}/sign-off` | 409 until every change is actioned | T-25 | Planned |
| `POST /reports/{reportId}/excel` | Build Excel from reviewed diff, return presigned GET | T-26 | Planned |

## `GET /reviews` response item

| Field | Type | Notes |
|---|---|---|
| `reportId`, `vendorId` | string | |
| `vendorName`, `system` | string | |
| `reportType` | `"SOC 1"` or `"SOC 2"` | D-25 |
| `reportKind` | `"Type I"` or `"Type II"` | |
| `periodStart`, `periodEnd` | date | |
| `status` | see lifecycle | |
| `exceptionCount`, `negativeChangeCount` | int >= 0 | |
| `updatedAt` | timestamp | |

Sortable by `vendorName`, `periodEnd`, `status`, `updatedAt`. Source: `frontend/src/api/reviews.ts`.
