# Photostore verification map

This directory is the maintained source for verifying the user-facing behavior of Photostore. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-photostore/bin/launch`.
- Drive only the `APP_URL` printed by launch/doctor (default `http://127.0.0.1:13000`).
- Run `.cursor/skills/verify-photostore/bin/doctor` and require `doctor: ok`, matching ports, and `compose_photostore=up`.
- Never drive `localhost:3000` / `localhost:8080` unless doctor printed those URLs for this run.
- On a fresh verify volume (`cleanup --volumes` then launch), `founder_exists=false` and `/` redirects to `/setup`.
- After first-run setup, `founder_exists=true`. Sign in as `verify.founder@photostore.local` / `VerifyPass1!`.
- Isolated Compose volumes are disposable. Do not point these recipes at the developer's named volumes.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer headings, buttons, links, and labeled textboxes over CSS or coordinates.
- Treat emails, album names, and button labels in the recipes as literal.
- Drive the browser against `$APP_URL`. Use launch/doctor/cleanup for process control only.
- After a mutation, navigate away and back (sidebar or in-app link) before calling it persisted.
- Leave proof under `evidence/<feature-id>/`. Cleanup must not remove it.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with Photostore identity visible.
- Mutation proof includes a second user-facing view of the stored value.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted control and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.
- Native file pickers cannot be completed in this harness. Record that as a skip for the upload/cover/picture sub-features, not as a pass via API.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the Cursor browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact control and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [First-run setup](./first-run-setup.md) covers creating the founder account on a fresh instance.
- [Sign in and out](./sign-in.md) covers sign-in, redirect, failed credentials, and sign-out.
- [Photos library](./photos-library.md) covers the empty library, navigation chrome, preview, and delete.
- [Albums](./albums.md) covers creating, opening, editing, and deleting an album.
- [Admin users](./admin-users.md) covers listing accounts and creating a regular user as founder.
