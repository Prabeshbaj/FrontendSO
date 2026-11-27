## Task
T-xx: <title> · Spec: `docs/specs/T-xx-*.md`

## Requirements covered
FR-xx, FR-yy

## Decisions
- Decisions relied on: D-xx
- Open items touched (and the assumption made): O-xx / none
- `decisions.md` updated in BackendSo: yes (link) / not needed
- [ ] `scripts/sync-backend-docs.sh --check` passes (run the sync if BackendSo docs changed)

## API contract
- [ ] No change, or `docs/api-contract.md` and Zod schemas updated together (backend PR: link)

## Checks (from `frontend/`)
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` pass
- [ ] Screenshots at 1366 and 390 wide (UI changes)
- [ ] `spec-reviewer` agent run; gaps fixed or explained

## Safety
- [ ] Synthetic data only. No real SOC report content, vendor names or PDFs
- [ ] No UI approves, rejects or scores a vendor; impact tags labelled "suggested"
