<!-- MIRROR of Prabeshbaj/BackendSo@175600f:docs/requirements.md. Do not edit here. Change it in BackendSo, then run scripts/sync-backend-docs.sh -->

# Requirements Specification

Draft v0.2, 2026-11-22. Numeric targets marked "proposed" need agreement from the risk team.

> **Changes since v0.2 (from `decisions.md`; decisions win where they differ):**
> - FR-01: SharePoint intake is deferred; v1 is manual upload only (D-06, T-36).
> - FR-03 / FR-05: comparison is per vendor + system + report type (D-24). Report types are
>   SOC 1 and SOC 2, Type I and Type II (D-25). Bridge letters open (O-10).
> - FR-16: one analyst signs off (D-28).
> - FR-18: v1 export is the Excel comparison filled from the reviewed diff (D-26, O-16).
>   PDF/Word export and saving to SharePoint are not in v1.
> - Storage is DynamoDB + S3 (D-13); infrastructure is CloudFormation (D-16).

## 1. Purpose

The tool gives a third-party risk analyst a cited summary of a vendor SOC report and a list of
what changed since the prior year. The analyst stays the decision maker; the tool removes the
reading and comparison work.

Today each SOC report is a long PDF read by hand. Changes between years, such as a new
exception, a dropped control or a narrower scope, are easy to miss because the two reports are
rarely read side by side.

## 2. Scope

| Capability | Release |
| --- | --- |
| Single-report summary with page citations | MVP |
| Year-over-year change list, each change classed positive, negative or neutral | MVP |
| Analyst review: accept, edit or reject each finding, then sign off | MVP |
| Intake from SharePoint or manual upload | MVP |
| Export of the reviewed summary | MVP |
| Approval recommendation (approve, approve with conditions, escalate) | Later |
| Mapping findings to the specific vendor software the company uses | Later |
| Integration with a GRC or TPRM platform | Later |
| Other attestations (ISO 27001, PCI AOC, SOC 3) | Later |

In the MVP the approval decision continues under the existing process, outside the tool.

## 3. Users and workflow

Third-party risk analysts are the primary users. Risk managers read completed reviews,
administrators manage configuration, and auditors need read-only access to review history.

1. The analyst picks a vendor report from SharePoint or uploads the PDF.
2. The system confirms the file is a readable SOC report and records vendor, system, report
   type and audit period.
3. The system finds the prior-period report for the same vendor and system, if one exists.
4. The system extracts the structured fields in section 5, each with a page citation.
5. The system compares the current and prior extractions and classifies each change.
6. The analyst reviews findings beside the cited PDF pages and accepts, edits or rejects each.
7. The analyst signs off. The system stores the reviewed record and exports the summary.
8. The approval decision is made under the existing process, using the reviewed summary.

## 4. Functional requirements

"Must" items define the MVP. "Should" items ship if time allows.

| ID | Area | Requirement | Priority |
| --- | --- | --- | --- |
| FR-01 | Intake | Select a PDF from a configured SharePoint library, or upload one directly. | Must |
| FR-02 | Intake | Accept text-based and scanned PDFs; scanned pages are processed with OCR. | Must |
| FR-03 | Intake | Detect vendor, system name, report type (SOC 1 or SOC 2, Type I or II), audit period and service auditor. The analyst can correct any of them. | Must |
| FR-04 | Intake | Flag files that are not SOC reports, are password-protected or appear incomplete, and stop processing. | Must |
| FR-05 | Intake | Link each report to a vendor record and to the prior-period report for the same system. | Must |
| FR-06 | Extraction | Extract every field defined in section 5. | Must |
| FR-07 | Extraction | Attach a page number and a short source excerpt to every extracted item. | Must |
| FR-08 | Extraction | Mark a field "not found in report" when the report does not state it. Never infer a value. | Must |
| FR-09 | Extraction | Produce a plain-language summary of one page or less covering opinion, scope, exceptions and items needing analyst attention. | Must |
| FR-10 | Comparison | List changes between current and prior reports by category: opinion, scope, exceptions, controls added, removed or modified, user entity controls, subservice organisations and auditor. | Must |
| FR-11 | Comparison | Class each change as positive, negative or neutral, with a one-sentence reason. | Must |
| FR-12 | Comparison | Flag any gap between the prior period end and the current period start. | Must |
| FR-13 | Comparison | When no prior report exists, deliver the single-report summary and state that no comparison was possible. | Must |
| FR-14 | Review | Show each finding beside the PDF page it cites. | Must |
| FR-15 | Review | Let the analyst accept, edit or reject each finding and add comments. Record every edit with user and time. | Must |
| FR-16 | Review | Block sign-off until every exception and every negative change has been acknowledged. | Must |
| FR-17 | Records | Store model input, model output, prompt version and model ID for every review. | Must |
| FR-18 | Records | Export the reviewed summary to PDF or Word and save it to the vendor's SharePoint folder. | Should |
| FR-19 | Records | Search past reviews by vendor, period, status and finding type. | Should |
| FR-20 | Records | Re-run a report with a newer prompt or model version while keeping earlier results. | Should |

## 5. Extraction schema

Every report is reduced to the same nine field groups, so two years can be compared field by
field. The machine-readable version lives in `prompts/schemas/` (task T-05).

| Field group | Fields |
| --- | --- |
| Report identity | Vendor, system or service name, report type, Type I or II, audit period start and end, report date, service auditor |
| Auditor opinion | Opinion type (unqualified, qualified, adverse, disclaimer) and the stated basis for any qualification |
| Scope | Trust services criteria (SOC 2) or control objectives (SOC 1), services and locations covered, stated exclusions |
| Controls and tests | Control ID, description, mapped criteria, test performed and result |
| Exceptions | Control ID, exception text, auditor's test detail, management response, remediation status |
| User entity controls | Each complementary user entity control and the criteria it supports |
| Subservice organisations | Name, service provided, carve-out or inclusive method, expected subservice controls |
| Disclosed changes and incidents | Significant system changes and incidents disclosed for the period |
| Other information | Unaudited content provided by management, labelled as unaudited |

Every extracted item carries `page` (integer) and `excerpt` (verbatim text from that page).

## 6. Non-functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-01 | Data boundary | All model calls go through AWS Bedrock in company-controlled accounts. Report content is sent nowhere else. |
| NFR-02 | Encryption | Reports, extractions and logs are encrypted in transit and at rest with customer-managed KMS keys. |
| NFR-03 | Access | Sign-in uses Okta (OIDC, authorization code flow with PKCE). Access to a vendor's reports is limited by role to authorised third-party risk staff. |
| NFR-04 | Untrusted input | Report text is treated as data. Instructions found inside a report never change system behaviour. |
| NFR-05 | Audit trail | Every upload, extraction, edit and sign-off is logged with user and time, and logs cannot be altered. |
| NFR-06 | Change control | Model ID and prompt version are pinned per release. Any change passes the evaluation gate in section 7. |
| NFR-07 | Failure handling | A partial or failed extraction is shown to the analyst as failed. Results are never silently truncated. |
| NFR-08 | Performance | A 150-page report is processed within 10 minutes (proposed). |
| NFR-09 | Capacity | Reports up to 300 pages are supported (proposed). |
| NFR-10 | Retention | Reports, extractions and logs follow the firm's records retention schedule. |

## 7. AI quality and acceptance criteria

The release gate is a golden set of analyst-reviewed reports that every prompt, schema or model
change is scored against.

The golden set holds 25 to 30 reports (proposed), hand-reviewed by analysts against the
section 5 schema. It includes SOC 1 and SOC 2 reports, at least one qualified opinion, reports
with exceptions, scanned PDFs and at least 10 year-over-year pairs. The golden set contains
real reports, so it lives in a restricted S3 bucket, never in this repository.

| Measure | Proposed target |
| --- | --- |
| Report identity and opinion type correct | 100% |
| Exceptions found (recall) | 98% or higher |
| Exceptions reported that are real (precision) | 90% or higher |
| Citations where the cited page contains the supporting text | 99% or higher |
| Findings with no support in the source | 0 |
| Year-over-year changes found (recall) | 95% or higher |
| Positive, negative or neutral class matches the analyst | 90% or higher |

- The evaluation runs in CI on every prompt, schema or model change. A result below target
  blocks the release.
- Analyst edits and rejections in production are reviewed monthly and added to the golden set.

## 8. Assumptions and constraints

- The analyst makes every decision. The MVP makes none and recommends none.
- Reports are PDFs written in English.
- SharePoint is the system of record for reports.
- Claude is available through AWS Bedrock in an approved account and region.
- Vendor NDAs allow reports to be processed inside that boundary.
- The tool falls under the firm's AI governance or model risk review.
- Human code review is required on every change.

## 9. Open questions

Tracked in `docs/decisions.md` under "Open".
