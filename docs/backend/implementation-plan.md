<!-- MIRROR of Prabeshbaj/BackendSo@175600f:docs/implementation-plan.md. Do not edit here. Change it in BackendSo, then run scripts/sync-backend-docs.sh -->

# Implementation Plan (v2)

Matches `docs/architecture.md` (architecture-v2). Work the tasks in order, one at a time. Each
task is one small pull request. A task is done only when its "Done when" is true and its test
passes. Refs point to `decisions.md` (D-xx, O-xx).

Infrastructure rule: every AWS resource comes from a CloudFormation template in
`infra/templates/`, deployed from the local CLI with `infra/deploy.sh <stack> <env>`
(`aws cloudformation package` + `aws cloudformation deploy`). Review the change set before
executing it. No console or ad-hoc CLI resource creation.

Order of work: offline core logic first (no AWS needed), then AWS spikes, then the pipeline,
then the API, then the UI. Tasks marked **Blocked** need an answer before they can finish.

## Phase 0: Foundations

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-01 | Scaffold the repo: `backend/` (uv, pytest, ruff, mypy), `infra/templates/` (CloudFormation YAML), `infra/deploy.sh`. `docs/` is already in place; the SPA is in FrontendSO (D-27) | Layout matches `backend/CLAUDE.md` and `infra/CLAUDE.md`; Commands sections filled in | `pytest` runs one passing test; `cfn-lint` passes on `bootstrap.yaml`. Deploy: `./infra/deploy.sh bootstrap dev` creates the artifacts bucket | D-16, D-23 |
| T-02 | Local quality gate `make check`: ruff, mypy, pytest, `cfn-lint` on all templates (CI/CD pipeline deferred per D-16) | One command runs everything and fails on any error | Add a deliberately failing test and a broken template; `make check` exits non-zero for each | D-16 |
| T-03 | Synthetic fixture generator `tests/fixtures/generate.py` (reportlab) | Produces invented SOC-style PDFs: SOC 1 Type II and SOC 2 Type II for 2 vendors, each with prior and current years; one with exceptions, one qualified opinion, one with a renumbered control, one with a period gap, one added and one removed subservice org, one scanned (rasterised) copy. Each PDF has a hand-written `expected.json` | Test regenerates fixtures and checks page counts and that `expected.json` validates against the schema | CLAUDE.md rule 2 |
| T-04 | Pydantic schemas in `soc/schemas.py`: `Cited`, `Exception_`, `SubserviceOrg`, `Cuec`, `BaseExtraction`, `Soc1Extraction`, `Soc2Extraction`, `Change` | Matches architecture section 6; every cited item requires `page` and `excerpt` | Unit tests: valid sample parses; missing `page` fails; unknown `report_type` fails; "not stated" accepted | D-25 |

## Phase 1: Core logic, offline (no AWS calls)

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-05 | `soc/textract.py`: convert Textract `Blocks` (all pages, all `NextToken` pages) to `pages.json`, tables as pipe-separated rows | Pure function, no boto3 call inside | Unit test with a saved, hand-made Textract response JSON: correct page numbers, line order, a 2x3 table rendered correctly | D-14 |
| T-06 | `soc/citations.py`: verify each `Cited` excerpt appears on its page (normalised whitespace, fuzzy threshold) | Returns verified / not verified per item | Unit tests: exact match, extra whitespace, wrong page, invented text, hyphenated line break | D-10 |
| T-07 | `soc/diff.py` scalar and period logic: opinion, report kind, auditor, period dates, period gap | Returns `Change` list | Unit tests: no change → empty; opinion change; Type I→II; 15-day gap detected; contiguous periods → no gap | D-09 |
| T-08 | `soc/diff.py` list logic: exceptions, CUECs, subservice orgs, services, control objectives (SOC 1), trust services categories (SOC 2) | Added / removed / modified per item; fuzzy match flags "possible rename" | Unit tests using fixture `expected.json` pairs: every known difference found, no false changes on identical input, renumbered control flagged as possible rename | D-09 |
| T-09 | `soc/registry.py` prior-report lookup key and query (GSI2: `VENDOR#id#type#system`, latest `periodEnd` before current) | Never returns another vendor, system or type | `moto` tests: two vendors, two systems, SOC 1 and SOC 2 mixed; correct prior chosen in each case; no prior → `None` | D-24 |
| T-10 | `soc/excel.py` + placeholder `templates/comparison-template.xlsx` and `template-map.json` | Header and change rows filled from the map; no cell address in Python | Unit test: fill with 3 changes, reopen with openpyxl, assert cells; change the map, cells move without code change | D-26, O-16 |

## Phase 2: AWS spikes (synthetic PDFs only)

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-11 | `infra/templates/storage.yaml`: KMS key, versioned S3 bucket (block public access, KMS encryption), DynamoDB table `soc-registry` with GSI1 and GSI2, on-demand, PITR on | Deployed to dev with `./infra/deploy.sh storage dev` | `cfn-lint` passes; pytest loads the template and asserts encryption, public-access block and both GSIs; after deploy, `aws cloudformation describe-stacks` shows `CREATE_COMPLETE` | D-13, D-16 |
| T-12 | Textract spike: script runs `StartDocumentAnalysis` on each fixture, saves raw responses, runs T-05 | `pages.json` produced for digital and scanned fixtures; note on time and cost per page | `@pytest.mark.aws` test: scanned fixture text contains a known sentence on the right page. Save one raw response as a unit-test fixture | D-14 |
| T-13 | Bedrock spike: confirm approved account, region, endpoint (runtime or mantle) and model IDs from **current docs**; call extraction on fixture `pages.json` with structured output | Schema-valid extraction for SOC 1 and SOC 2 fixtures; tokens, latency and cost recorded; Sonnet 5.5 vs Opus 5.5 compared | `@pytest.mark.aws` test: extraction matches `expected.json` on opinion, period, exception count. **Blocked** on O-2, O-13 | D-19, O-2, O-13 |
| T-14 | Evaluation harness `evals/run.py`: runs extract + diff over all fixtures, scores against `expected.json` | Prints field accuracy, exception recall/precision, citation verification rate, change recall; non-zero exit below thresholds | Run it; a deliberately broken prompt drops the score and exits non-zero | rule 10 |

## Phase 3: Pipeline

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-15 | `handlers/collect_text.py` Lambda using T-05 | Reads Textract job, writes `pages.json`, returns `{pagesKey}` | Unit test with Stubber for `get_document_analysis` (two `NextToken` pages) and `moto` S3 | D-05 |
| T-16 | `handlers/extract.py` Lambda using `soc/extract.py` + T-06 | Writes `extraction.json` with data, citation flags, model ID, prompt version; raises on `max_tokens`, `refusal` or validation error | Unit test with a faked Bedrock client: success path, cut-off path raises, invalid JSON raises | rules 7, 10 |
| T-17 | `soc/explain.py` + `handlers/compare.py` Lambda | Finds prior (T-09), diffs (T-07/T-08), one Bedrock call adds explanation and *suggested* impact; writes `diff.json`; sets status `READY_FOR_REVIEW` or `NO_PRIOR` | Unit tests with faked Bedrock and `moto`: no prior → `NO_PRIOR`; with prior → changes saved and each impact labelled suggested | rule 1 |
| T-18 | `infra/templates/pipeline.yaml`: 3 step Lambdas, state machine using `infra/state_machine.asl.json` (`DefinitionS3Location` or `DefinitionString`), least-privilege role per Lambda and for the state machine | Deployed with `./infra/deploy.sh pipeline dev` (package + deploy) | `cfn-lint` passes; pytest asserts only `extract` and `compare` roles have Bedrock permissions and only the state machine role has Textract permissions | D-05, D-16 |
| T-19 | Trigger in `pipeline.yaml`: S3 EventBridge notifications on (in `storage.yaml`), rule for `report.pdf` `Object Created` → state machine | Upload starts a run; `executionArn` stored on the report item | `@pytest.mark.aws` end-to-end: upload a synthetic prior and current pair; second run ends `READY_FOR_REVIEW` with expected changes. Broken PDF ends `FAILED` | |

## Phase 4: API

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-20 | API Lambda skeleton (FastAPI + Mangum or Powertools) and `infra/templates/api.yaml` (API Gateway with Okta JWT authorizer), deployed with `./infra/deploy.sh api dev` | Unauthenticated calls get 401; claims available to routes; role check helper | Unit tests on the role helper; deployed test: no token → 401. **Blocked** on O-3, O-12 | D-05a, D-15 |
| T-21 | Vendor routes: create, list (GSI1), get, update | Validation errors return 400 | `moto` + test client tests for each route | |
| T-22 | Upload route: create report item (vendor, system, type, kind, year) and return presigned PUT URL | Only PDFs accepted; key follows S3 layout | Test: URL generated for correct key; non-PDF content type rejected | |
| T-23 | Report and comparison read routes: list reports per vendor, get status, get `diff.json` with both sides' pages, presigned GET for the PDF | Status reflects pipeline state | `moto` tests per status (`UPLOADING`, `EXTRACTED`, `FAILED`, `NO_PRIOR`, `READY_FOR_REVIEW`) | |
| T-24 | Review routes: confirm, edit or reject a change, set final impact, add comment; each writes an `EDIT#` item | Every edit has user and time | Test: edit stored; original diff value preserved; edit by user without analyst role → 403 | rule 17 |
| T-25 | Sign-off route | Refused until every change has an analyst action; records `signedOffBy` and time; no vendor decision field exists | Tests: sign-off with pending rows → 409; complete → 200 and recorded | rule 1 |
| T-26 | Generate Excel route using T-10 from the reviewed diff | Saves `comparison.xlsx`, returns presigned GET | Test: generated workbook contains analyst-final values, not raw suggestions | D-26 |

## Phase 5: Frontend

T-27 to T-31 are built in the FrontendSO repo (D-27). T-32 (SPA hosting template) is built here.

| ID | Task | Done when | Test | Refs |
|---|---|---|---|---|
| T-27 | Okta sign-in shell, API client with bearer token, route guard | Signed-out users see login only | Vitest + Testing Library: guard redirects; token attached to requests (mocked) | D-05a |
| T-28 | Vendors page: list, search, add, edit | Calls T-21 routes | Component tests with mocked API | |
| T-29 | Upload page: pick vendor, system, report type, kind, year; upload to presigned URL; poll status | Shows `FAILED` reason clearly | Component tests for each status | |
| T-30 | Comparison review screen: table of changes with prior/current values, page refs, suggested impact (labelled "suggested"), confirm/edit/reject, comments; PDF page viewer | Analyst can action every row | Component tests: actions call T-24; suggested label always shown | rule 1 |
| T-31 | Excel download and sign-off buttons | Sign-off disabled until all rows actioned | Component test for disabled state; end-to-end test on dev with synthetic pair | |
| T-32 | `infra/templates/frontend.yaml`: S3 + CloudFront for the SPA; upload build with `aws s3 sync` | Deployed with `./infra/deploy.sh frontend dev` | `cfn-lint` passes; pytest asserts bucket not public and CloudFront origin access control | D-16 |

## Phase 6: Later or blocked

| ID | Task | Blocked on |
|---|---|---|
| T-33 | Replace placeholder Excel template and map with the real template | Prabesh sharing the template (O-16) |
| T-34 | Pre-real-data checklist: data retention mode on Bedrock, NDA approval, region and routing | InfoSec and Legal (O-2, O-4) |
| T-35 | Enterprise hardening (WAF, VPC endpoints, Object Lock audit, backups and DR, alarms, X-Ray) | Deferred by Prabesh on 2026-11-26 |
| T-36 | SharePoint intake | D-06 deferred |

## Open items this plan touches

- O-2, O-13: Bedrock account, region, endpoint and model (T-13)
- O-3, O-12: API privacy and Okta settings (T-20)
- O-16: Excel template (T-10 placeholder, T-33 real)
- CI/CD pipeline: deferred by D-16; all deploys run from the local CLI for now
