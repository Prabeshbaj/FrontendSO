---
name: spec-task
description: Write the spec for one implementation-plan task (T-xx) before any code is written. Use at the start of every task.
disable-model-invocation: true
---
Write the spec for task $ARGUMENTS. Do not edit code.

1. Run `scripts/sync-backend-docs.sh --check`. If it reports stale files, ask the human
   to sync first. Find the task row in `docs/backend/implementation-plan.md`. Note its Refs.
2. Read the FR-xx requirements it covers in `docs/backend/requirements.md`, the D-xx and
   O-xx items in `docs/backend/decisions.md`, and `docs/api-contract.md`.
3. Read the existing code the task touches. Reuse components in `src/theme/components`.
4. List every Open (O-xx) item the task depends on. If one blocks the task, stop and say so.
5. Ask the human about the hard parts: edge cases, empty and error states, roles, anything
   the docs leave open. Do not guess.
6. Copy `docs/specs/_template.md` to `docs/specs/$ARGUMENTS-<short-name>.md` and fill it in.
   Every FR gets at least one test row. End with the verification commands.
7. If the task needs an API contract change, list it under "Files and interfaces".
8. Stop and ask the human to review the spec.
