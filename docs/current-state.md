# Current state

| Field | Value |
|-------|-------|
| Last updated | 2026-07-10T20:40:00+03:00 |
| Last action | Archived OpenSpec change `add-document-numbering`; synced delta specs to main |
| Current focus | Next capability: `contacts` (steps 3–4) |
| Key decisions | Issue on step-2 «Далі» via `POST .../issue-numbers`; counters in `{data-root}/{year}/doc_number.json`; in-process year mutex + atomic replace; date PATCH on change; idempotent re-issue |
| Blockers / open questions | None |
| Relevant paths | `lib/document-numbering/`, `app/api/docs/[guid]/issue-numbers/`, `app/docs/[guid]/document-numbering-step.tsx`, `openspec/specs/document-numbering/`, `openspec/changes/archive/2026-07-10-add-document-numbering/` |

## Shipped: `add-document-numbering` (archived)

- Main specs: new `document-numbering`; `wizard-shell` stub requirement updated for real step 2
- Yearly counter store + `issueNumbersForSession` (TC-08–TC-10, idempotent, per doc-type)
- `POST /api/docs/[guid]/issue-numbers`
- Step 2 UI wired in `WizardShell`; stubs remain for steps 3–7
- Archive: `openspec/changes/archive/2026-07-10-add-document-numbering/`

## Shipped: `add-document-type` (archived)

- Main specs: new `document-type`; `wizard-shell` stub requirement updated for real step 1
- Step 1 radios + copy-from-guid; numbers omitted on copy (BC-11)
- Archive: `openspec/changes/archive/2026-07-10-add-document-type/`

## Shipped (prior)

- `document-session`, `wizard-shell`, `locale-helpers` — see archive under `openspec/changes/archive/`
