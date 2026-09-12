---
name: verify-photostore
description: Drive the Photostore web UI (TanStack Start on the isolated verify ports) to prove user-facing behavior. Use when a change touches setup, sign-in, the photo library, albums, profile, admin users, or the Vite/API proxy, and you need a real-browser proof rather than unit tests.
---

# Verify Photostore

Photostore is a self-hosted photo/video library. A user touches the **web UI** at the frontend. The Spring Boot API and SQL Server sit behind it. Swagger at `/swagger-ui.html` is not a user path. There is no CLI and no Playwright/Cypress harness; drive the UI with the Cursor browser (navigate, snapshot, click, fill, screenshot).

Never drive `http://localhost:3000` or `http://localhost:8080` unless `bin/doctor` printed those exact URLs for **this** run. Those are the developer's default stack. Sharing them corrupts the user's session and data.

## Launch

From the repository root:

```bash
.cursor/skills/verify-photostore/bin/launch
```

Launch starts a dedicated Compose project `photostore-verify` (SQL Server + API) and a Vite frontend that proxies `/api` to that API. Defaults:

| Surface | URL | Host port |
| --- | --- | --- |
| Web UI | `http://127.0.0.1:13000` | `FRONTEND_PORT` (13000) |
| API | `http://127.0.0.1:18080` | `APP_PORT` (18080) |
| SQL Server | 127.0.0.1:11433 | `MSSQL_PORT` (11433) |

Ready when launch prints `launch: ready` and `APP_URL=...`. The API is ready when `GET /api/v1/founder/exists-founder` returns HTTP 200 (`true` or `false`). The frontend is ready when `GET $APP_URL/` returns 200 or a redirect (TanStack Start may send 307 on `/`).

Requires Docker Compose, Bun, and a repo-root `.env` (copy `.env.example` and set `DB_PASSWORD`, `JWT_SECRET`, `PHOTO_STORE_MASTER_KEY`). First image build can take several minutes.

If a port is already bound, launch refuses. Do not reuse the occupant. Override ports only together:

```bash
FRONTEND_PORT=13001 APP_PORT=18081 MSSQL_PORT=11434 \
  .cursor/skills/verify-photostore/bin/launch
```

The frontend must see `VITE_DEV_API_PROXY` (launch sets it). That env changes the Vite `/api` proxy and the SSR API base. Do not set `VITE_API_BASE_URL` during verification; cookies are first-party only when the browser talks to the frontend origin.

Two verify stacks can share a machine if every port and `COMPOSE_PROJECT` differ. They cannot share the default developer ports. If `bin/launch` reports a healthy existing verify instance, reuse it. If state exists but doctor fails, run cleanup first.

## Doctor

Run first whenever anything looks off:

```bash
.cursor/skills/verify-photostore/bin/doctor
```

Doctor is read-only. It confirms the state file from this helper, the frontend PID is alive, `FRONTEND_PORT` is owned by that PID or a child (Vite's listen pid is often the child), Compose services `photostore` and `mssql` are running in `COMPOSE_PROJECT`, the founder probe returns HTTP 200, and `$APP_URL/` returns 200 or a redirect. It prints `founder_exists=true|false`. Refuse to drive if doctor exits non-zero.

## Drive

Read `features/README.md`, then the feature file. Start from the URL doctor printed.

Use Cursor browser tools against `$APP_URL` only. Prefer roles and accessible names from this repo:

| Handle | Where |
| --- | --- |
| heading `Create the founder account` | `/setup` |
| heading `Sign in` | `/signin` |
| textbox `Email` / `Password` / `Confirm password` | setup and sign-in forms (`id` matches the name) |
| button `Create founder account` | setup submit; becomes `Creating founder...` |
| button `Sign in` | sign-in submit; becomes `Signing in...` |
| heading `My Photos` (chrome) and `Photos` (page) | `/` after auth |
| `Add your first photos` | empty library |
| link `Photos`, `Albums`, `Admin` | sidebar (`aria-current="page"` when active) |
| link whose name is the signed-in email | sidebar → `/profile` |
| button `Sign out` | sidebar and profile |
| button `Upload photos` | top bar; hidden on `/albums` and `/albums/$albumId` |
| button `Create album` | top bar on `/albums`; dialog title `Create album` |
| textbox `Name`, `Description`; button `Create album` / `Save changes` / `Cancel` | album dialog |
| heading `No albums yet` + button `Create your first album` | empty albums |
| link named like the album | album card → `/albums/$albumId` |
| button `Actions for <album>` | album card menu (`Edit`, `Delete`) |
| heading `Manage accounts` + button `Add user` | `/admin` (founder/admin only) |
| heading `Your profile` | `/profile` |
| button `Switch to dark theme` / `Switch to light theme` | top bar |

Do not call founder/admin APIs to skip a screen the map lists as a user entry. `GET /api/v1/founder/exists-founder` is only for doctor and choosing setup vs sign-in.

File inputs (`Upload photos`, album cover, profile picture) are `sr-only` or native `<input type="file">`. The Cursor browser cannot attach disk files through CDP file choosers. Prove upload by exercising the control and recording the limitation; do not invent a backend-only upload as a substitute.

Isolated fixture account (create it through `/setup` on a fresh verify volume):

- Email: `verify.founder@photostore.local`
- Password: `VerifyPass1!`

## Evidence

Write proof under `.cursor/skills/verify-photostore/evidence/<feature-id>/`. Keep it after cleanup.

For every driven path capture:

1. The action (ARIA snapshot or screenshot **before** or **during** the control use).
2. The resulting UI (ARIA snapshot + screenshot with Photostore identity visible: sidebar wordmark, page heading, or auth card title).
3. A `notes.md` that names the feature ID, entry point, `$APP_URL`, and the observable end state.

Proof standards:

- Exercise the real user path in the browser. Do not POST credentials or create albums through curl unless the feature file says the API is a second-view check of a side effect.
- A final screenshot alone is not proof. Keep the action and the new state.
- After a mutation, reopen the destination from navigation (sidebar link, album list) so persistence is visible.
- Side effects: a created album remains on `/albums`; a created user remains in the admin table; a deleted album is gone and its photos (if any) still appear on `/`.
- No mocks. The verify stack is the real API and SQL Server. Encryption and storage volumes are real.

## Cleanup

```bash
.cursor/skills/verify-photostore/bin/cleanup
```

Stops the frontend PID from the state file and `docker compose -p photostore-verify down`. Volumes stay so the next launch can skip SQL init and keep the founder account.

```bash
.cursor/skills/verify-photostore/bin/cleanup --volumes
```

Also drops verify volumes. Use this to restore `/setup` (founder-not-exists). Never `docker kill` by container name. Never delete `evidence/`.

## Helpers

All three are executable. Run them from any cwd; they locate the repo themselves.

```bash
.cursor/skills/verify-photostore/bin/launch
.cursor/skills/verify-photostore/bin/doctor
.cursor/skills/verify-photostore/bin/cleanup
.cursor/skills/verify-photostore/bin/cleanup --volumes
```
