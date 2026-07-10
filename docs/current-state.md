# Current state

| Field | Value |
|-------|-------|
| Last updated | 2026-07-10T21:06:00+03:00 |
| Last action | Archived OpenSpec change `add-services-catalog`; synced delta specs to main |
| Current focus | Next capability: `template-fill` (wizard step 6) |
| Key decisions | Catalog = single `{data-root}/jobs/services.json` array; upsert by `sign-name`; session `services[]` snapshot on «Далі»; `GET/PUT /api/jobs/services` |
| Blockers / open questions | None |
| Relevant paths | `lib/services-catalog/`, `app/api/jobs/services/route.ts`, `app/docs/[guid]/services-step.tsx`, `openspec/specs/services-catalog/spec.md` |

## Shipped: `add-services-catalog` (archived)

- Main specs: new `services-catalog`; `wizard-shell` stub requirement updated for real step 5
- Store: `lib/services-catalog` — `readServicesCatalog` / `writeServicesCatalog` / `upsertServicesIntoCatalog` at `{data-root}/jobs/services.json`
- API: `GET/PUT /api/jobs/services`
- UI: `ServicesStep` on wizard step 5 (catalog pick, multi-row lines, «додати ще»); stubs remain for 6–7
- Covers FR-11–FR-12, NFR-10/13, TC-14
- Archive: `openspec/changes/archive/2026-07-10-add-services-catalog/`
- Next: `template-fill`

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
