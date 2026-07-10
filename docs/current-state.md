# Current state

| Field | Value |
|-------|-------|
| Last updated | 2026-07-10T19:52:00+03:00 |
| Last action | Archived OpenSpec change `add-document-session`; synced delta to `openspec/specs/document-session/spec.md` |
| Current focus | Next: `wizard-shell` (progress chrome, Back/Next, persist `current-step`) |
| Key decisions | `DATA_ROOT` default `./data` → `data/docs/{guid}.json`; kebab-case JSON; Route Handlers `POST/GET/PATCH` + `/export`; stub UI + PATCH controls until wizard-shell |
| Blockers / open questions | None |
| Relevant paths | `lib/document-session/`, `app/api/docs/`, `app/page.tsx`, `app/docs/[guid]/`, `data/docs/`, `openspec/specs/document-session/`, `openspec/changes/archive/2026-07-10-add-document-session/` |

## Session contract (shipped)

- Create: `/` → `createSession()` → redirect `/docs/{guid}`
- Persist: `{DATA_ROOT}/docs/{guid}.json` (gitignore `data/docs/*.json`)
- API: `POST /api/docs`, `GET|PATCH /api/docs/[guid]`, `GET /api/docs/[guid]/export`
- Resume: unfinished → show `current-step`; `completed` → final-review placeholder; invalid/missing → error UI, no write
