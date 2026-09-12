# Sign in and out

Sign in lets an existing user open the library with the email and password they were given. Sign out returns them to the sign-in card and blocks library routes.

## Sub-features

- `signin-redirect` sends anonymous visitors to `/signin` when a founder already exists.
- `signin-reject` keeps the user on `/signin` for bad credentials or empty fields.
- `signin-success` opens `/` (or the `redirect` search target) after valid credentials.
- `signout-sidebar` and `signout-profile` clear the session from each entry.

## How to get to it (user POV)

- Open `/` or another authenticated route while signed out.
- Open `/signin` directly.
- Choose `Sign out` in the sidebar.
- Choose `Sign out` on `/profile`.

## Driving it with the Cursor browser

Preconditions:

- `bin/doctor` reports `doctor: ok` and `founder_exists=true`.
- The founder is `verify.founder@photostore.local` / `VerifyPass1!`. If those fail, the volume was seeded with another password; stop and report rather than guessing.
- Start signed out. If the library is visible, choose sidebar `Sign out` first.

- **Anonymous redirect.** Open `$APP_URL/`. The heading is `Sign in`. The kicker is `Welcome back`.
- **Empty validation.** Choose `Sign in` with empty fields. Email or Password shows an error. The URL stays `/signin`.
- **Bad password.** Fill Email `verify.founder@photostore.local` and Password `wrong-password`. Choose `Sign in`. The user remains on `/signin`. A toast reports the failure. The Photos heading does not appear.
- **Successful sign-in.** Fill the same email and Password `VerifyPass1!`. Choose `Sign in` (may read `Signing in...`). The chrome heading becomes `My Photos` and the sidebar shows the founder email.
- **Redirect target.** Sign out. Open `$APP_URL/signin?redirect=/albums`. Sign in with the fixture. The chrome heading is `Albums` and the URL is `/albums`.
- **Sidebar sign-out.** Choose `Sign out` in the sidebar (may read `Signing out...`). The heading is `Sign in` again. Opening `$APP_URL/` stays on `/signin`.
- **Profile sign-out.** Sign in. Open the sidebar link named `verify.founder@photostore.local`. The heading is `Your profile`. Choose the card button `Sign out`. The heading is `Sign in`.
- **Proof.** Capture the sign-in card, the authenticated library or albums heading, and the signed-out card. Write `evidence/sign-in/` snapshots, screenshots, and `notes.md` naming `signin-success` and the `/` entry.

## Gotchas

- `/setup` is the wrong page when `founder_exists=true`. If you see `Create the founder account`, stop; do not create a second founder.
- `redirect` must be an in-app path. The app ignores external URLs.
- Toasts are transient. The durable proof is the heading and URL after the action.
- JWT cookies are httpOnly on the frontend origin. Do not inspect them in `document.cookie`.
