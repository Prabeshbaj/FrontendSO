<!-- MIRROR of Prabeshbaj/BackendSo@175600f:docs/decisions.md. Do not edit here. Change it in BackendSo, then run scripts/sync-backend-docs.sh -->

# Decisions

One row per decision. Status is one of:

- **Decided**: build on it.
- **Proposed**: the current recommendation. Confirm with the owner before building anything
  that would be expensive to reverse.
- **Open**: not answered. Do not assume an answer.

Update this file in the same pull request as any change that makes or alters a decision.

## Decided

| ID | Decision | Why |
| --- | --- | --- |
| D-01 | Everything runs on AWS. | Company direction. SharePoint and Okta are the only external systems. |
| D-02 | Claude is called through Amazon Bedrock. | Keeps report content inside company-controlled AWS accounts (NFR-01). |
| D-03 | MVP scope is single-report summary plus year-over-year changes. Approval recommendation and product mapping come later. | Chosen by the product owner. |
| D-04 | Primary users are third-party risk analysts. | They perform SOC reviews today. |
| D-05a | Sign-in is Okta, OIDC authorization code flow with PKCE. Cognito is not used. | Existing company SSO. |
| D-06 | SharePoint is the source of reports. SharePoint intake is deferred; v1 uses manual upload (architecture §10, T-36). | Where reports are stored today. |
| D-07 | The UI is custom built. Backend is built first. | No side-by-side evidence review or per-finding sign-off was found in Amazon Quick's documentation (checked 2026-11-22). |
| D-08 | The analyst makes every decision. The tool never approves or rejects a vendor. | Risk and governance requirement. |
| D-09 | Year-over-year comparison is computed in code on structured extractions. The model only classifies and explains changes. | Deterministic, testable, and avoids asking a model to compare two long PDFs. |
| D-10 | Citations are verified in code against extracted page text. | Required to hold the "zero unsupported findings" target. |
| D-13 | DynamoDB single table `soc-registry` for all data; S3 for PDFs and outputs. No relational database. | Confirmed by Prabesh 2026-11-26. |
| D-14 | Textract (async, TABLES + LAYOUT) reads every report in v1. Claude receives Textract page text, not the PDF. | Confirmed by Prabesh 2026-11-26. |
| D-16 | Every AWS resource is created with plain CloudFormation templates, deployed from the local AWS CLI (aws cloudformation package and deploy). No CDK, no console or ad-hoc CLI resource creation. CI/CD pipeline deferred. | Confirmed by Prabesh 2026-11-26. |
| D-23 | Backend language is Python. | Confirmed by Prabesh 2026-11-26. |
| D-24 | A report is compared only with the latest prior report of the same vendor, same report type and same system (a vendor can have several systems). | Confirmed by Prabesh 2026-11-26. |
| D-25 | MVP report types are SOC 1 and SOC 2, Type I and Type II. | Confirmed by Prabesh 2026-11-26. |
| D-27 | Two repos: FrontendSO holds the React SPA; BackendSo holds the Python code, all CloudFormation templates (including the SPA hosting stack) and the shared docs. The API contract is mirrored in both. | Confirmed by Prabesh 2026-11-27. |
| D-28 | Sign-off is by one analyst, once every change has an analyst action. No manager review step. The tool records the sign-off, never a vendor decision. | Confirmed by Prabesh 2026-11-27. |

## Proposed

| ID | Proposal | Why | Alternative | Owner to confirm |
| --- | --- | --- | --- | --- |
| D-05 | Orchestrate the pipeline with Step Functions (Standard), 4 steps: Textract wait loop, collect text, extract, compare. | Textract is asynchronous; Step Functions waits without running compute and retries each step. | ECS Fargate worker reading an SQS standard queue with a dead-letter queue. | Tech lead |
| D-11 | Custom build on Bedrock, not Amazon Quick alone. | Per AWS documentation checked 2026-11-22: Quick's knowledge bases retrieve passages, with no guarantee the whole report is read, and no accuracy scoring or evidence review screen was found. | Hybrid: Quick for workflow and dashboards, custom extraction service behind it. | Sponsor |
| D-12 | Lambda for API services and pipeline steps. | Low volume, bursty, little to operate. | ECS Fargate, if the team standard is long-running containers. Depends on O-1. | Tech lead |
| D-15 | HTTP API built-in JWT authorizer validates Okta tokens, if O-3 allows; Lambda authorizer otherwise. | Less code. Whether private REST APIs lack built-in JWT validation is unverified. | REST API with a Lambda authorizer. | Tech lead, InfoSec |
| D-17 | Deferred: one extraction call per report in v1. Split per field group only if accuracy or output size demands it. | Simpler; full text fits one call for most reports (unverified for 300 pages). | One call per field group, per section. | Tech lead |
| D-18 | Run identity is (report hash, prompt version, model ID). Results are immutable. | Reproducibility and audit. Supports re-runs (FR-20). | None | Tech lead |
| D-19 | Use one Claude model for every pipeline step at first. Run Claude Sonnet 5.5 and Claude Opus 5.5 on the same fixtures and take the cheaper one that meets the accuracy targets; choose Opus if results are close. | Volume is low, so accuracy matters more than token cost. One model ID is simpler to pin, approve and evaluate. | Claude Haiku 5.5 for simple classification steps later, if cost or speed matters. | Tech lead, InfoSec |
| D-20 | Call Bedrock from Python with the Anthropic SDK's Bedrock client and Pydantic models for structured output. This has not been run; confirm in T-07. | Typed, validated output and built-in retries. | boto3 Converse or InvokeModel with hand-written schema validation. | Tech lead |
| D-21 | Deferred with D-17: no Map state in v1. Lambdas pass S3 keys only, never report text. | Stays inside the Step Functions payload limit. | Map state with concurrency 3 to 5. | Tech lead |
| D-22 | Whole-document comparison (both PDFs in one call) is used only as a baseline in the spike and, later, as an optional second-opinion step whose output is shown to the analyst as unverified. | It can catch changes the schema does not model, but it is not complete, repeatable or testable enough for the core result. | None | Tech lead |
| D-26 | Excel output is filled by code from the analyst-reviewed diff, through a configurable cell map (`templates/template-map.json`). | Template not received yet; layout changes need no code change. | None | Product owner |

## Open

| ID | Question | Owner | Blocks |
| --- | --- | --- | --- |
| O-2 | Which Bedrock account, region and Claude model ID are approved? Is cross-region inference routing acceptable for NDA-covered reports? | InfoSec, cloud platform | T-07 |
| O-3 | Which API Gateway type and private access pattern does the firm use for internal apps? | Cloud platform | T-21 |
| O-4 | Do vendor NDAs permit processing SOC reports with an AI service inside the firm's AWS boundary? | Legal, third-party risk | Any use of real reports |
| O-5 | Does the tool need AI governance or model risk review, and at which stage? | AI governance | Production release |
| O-6 | Which analysts build the golden set, and how many hours can they commit? | Third-party risk lead | T-09 with real data |
| O-7 | Are the proposed accuracy targets acceptable? | Risk lead | Release gate |
| O-8 | How are SharePoint libraries organised, and how is a prior-year report identified? | Third-party risk operations | T-19 |
| O-9 | What retention period applies to reports, extractions and audit logs? | Records management | T-03 bucket policies |
| O-10 | Are bridge letters in scope? (SOC 1 and SOC 2 are decided in D-25.) | Third-party risk lead | Extra document type |
| O-11 | How many vendors and reports per year, and is there a peak season? | Third-party risk lead | Capacity settings |
| O-12 | Okta: custom authorization server, audience value, and the claim name that carries groups? | Okta administrators | T-21 |
| O-13 | Which Bedrock endpoint (bedrock-runtime or bedrock-mantle) has an approved VPC endpoint? This decides which SDK client is used. | Cloud platform | T-07 |
| O-14 | Does the firm already license a third-party risk platform with AI SOC report summarisation? | Third-party risk lead | Build versus buy for the single-report summary |
| O-15 | Amazon Quick Automate is not available to the team yet. Is access planned? | Sponsor | The hybrid alternative in D-11 |
| O-16 | Excel template columns and layout (Prabesh to share with dummy values). | Prabesh | T-10 real layout, T-33 |
