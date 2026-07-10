# Current state

| Field | Value |
|-------|-------|
| Last updated | 2026-07-10T20:23:00+03:00 |
| Last action | Archived OpenSpec change `add-document-type`; synced delta specs to main |
| Current focus | Propose/implement `document-numbering` (step 2: date + invoice/act numbers) |
| Key decisions | Step 1 client form; PATCH for `doc-type`; `POST .../copy` + `copySessionFields`; numbers always stripped (BC-11); «Далі» blocked while copy guid field is non-empty |
| Blockers / open questions | None |
| Relevant paths | `openspec/specs/document-type/spec.md`, `openspec/specs/wizard-shell/spec.md`, `openspec/changes/archive/2026-07-10-add-document-type/`, `app/docs/[guid]/document-type-step.tsx`, `app/api/docs/[guid]/copy/route.ts` |

## Shipped: `add-document-type` (archived)

- Main specs: new `document-type`; `wizard-shell` stub requirement updated for real step 1
- Step 1 radios + copy-from-guid; numbers omitted on copy (BC-11)
- Archive: `openspec/changes/archive/2026-07-10-add-document-type/`

## Shipped (prior)

- `document-session`, `wizard-shell`, `locale-helpers` — see archive under `openspec/changes/archive/`
