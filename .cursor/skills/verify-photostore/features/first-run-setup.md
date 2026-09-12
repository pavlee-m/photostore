# First-run setup

First-run setup lets the first visitor create the permanent founder account and land in an empty library. After a founder exists, this path is gone.

## Sub-features

- `setup-redirect` sends an unauthenticated visitor to `/setup` when no founder exists.
- `setup-validate` blocks submit until email, password (≥8), and matching confirmation are valid.
- `setup-create` creates the founder and signs them in.
- `setup-library` shows the authenticated Photos empty state after create.

## How to get to it (user POV)

- Open `/` or any authenticated route on a fresh instance.
- Open `/setup` directly.
- Open `/signin` on a fresh instance (redirects to `/setup`).

## Driving it with the Cursor browser

Preconditions:

- `bin/doctor` reports `doctor: ok` and `founder_exists=false`.
- If `founder_exists=true`, this feature is already consumed. Run `bin/cleanup --volumes` and `bin/launch`, then doctor again. Do not treat sign-in as a substitute.

- **Root redirect.** Open `$APP_URL/`. The document heading is `Create the founder account`. The kicker text is `First-time setup`.
- **Sign-in redirect.** Open `$APP_URL/signin`. The same setup heading is shown; `/signin` is not kept.
- **Validation.** Choose `Create founder account` with empty fields, or type a short password. The Email, Password, or Confirm password fields show an error (`Enter a valid email address`, `Password must be at least 8 characters`, or `Passwords do not match`). The URL stays `/setup`.
- **Create founder.** Fill Email `verify.founder@photostore.local`, Password `VerifyPass1!`, Confirm password `VerifyPass1!`. Choose `Create founder account`. The button may read `Creating founder...`. The app navigates to `/`.
- **Empty library.** The chrome heading is `My Photos`. The page heading is `Photos`. The empty title `Add your first photos` is visible. The sidebar shows `Photostore` and a profile link named `verify.founder@photostore.local`. An `Admin` link is present.
- **Path consumed.** Reload `$APP_URL/setup`. The setup form is gone; the session stays on `/` (or `/signin` after sign-out).
- **Proof.** Capture setup (heading + form) and the empty library. Write `evidence/first-run-setup/setup.aria.yml`, `evidence/first-run-setup/library.aria.yml`, matching screenshots, and `notes.md` naming `setup-create` and the `/` entry.

## Gotchas

- Founder creation is one-shot per verify volume. A leftover `photostore-verify` volume makes doctor print `founder_exists=true`.
- Do not POST `/api/v1/founder/create-founder` to skip the form.
- The submit button disables while `canSubmit` is false or while submitting. Wait for `/` and `Add your first photos`, not a fixed sleep.
- Password must be at least 8 characters. `VerifyPass1!` is the fixture; other passwords make later sign-in recipes fail.
