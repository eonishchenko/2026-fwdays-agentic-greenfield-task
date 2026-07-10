# Current state

| Field | Value |
|-------|-------|
| Last updated | 2026-07-10T20:53:00+03:00 |
| Last action | Archived OpenSpec change `add-contacts`; synced delta specs to main |
| Current focus | Next capability `services-catalog` (wizard step 5) |
| Key decisions | Shared `ContactsStep` with role prop; `GET/PUT /api/contacts`; catalog then session snapshot on «Далі»; MVP inn = non-empty key (no checksum) |
| Blockers / open questions | None |
| Relevant paths | `lib/contacts/`, `app/api/contacts/`, `app/docs/[guid]/contacts-step.tsx`, `openspec/specs/contacts/` |

## Shipped: `add-contacts` (archived)

- Main specs: new `contacts`; `wizard-shell` stub requirement updated for real steps 3–4
- Store: `lib/contacts` — `listContacts` / `getContact` / `putContact` under `{data-root}/contacts/{inn}.json`
- API: `GET /api/contacts?q=`, `GET/PUT /api/contacts/[inn]`
- UI: shared `ContactsStep` for steps 3 (замовник → `client`) and 4 (виконавець → `done-by`); stubs remain for 5–7
- Covers FR-08–FR-10, NFR-05/10, BC-05, TC-11–TC-13, TC-26
- Archive: `openspec/changes/archive/2026-07-10-add-contacts/`

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
