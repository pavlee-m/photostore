# Admin users

Admin users lets the founder (or an admin) create accounts, assign User or Admin roles, and review storage. The founder row has no Edit/Delete actions.

## Sub-features

- `admin-gate` hides `/admin` from regular users and omits the sidebar `Admin` link.
- `admin-list` shows the account table with Email, Role, Storage, Used.
- `admin-create` adds a user from `Add user`.
- `admin-founder-protected` leaves the founder row without Edit/Delete.

## How to get to it (user POV)

- Choose sidebar `Admin` (founder and admin only).
- Open `/admin` directly (regular users are sent to `/`).
- Choose `Add user` on the manage-accounts page.

## Driving it with the Cursor browser

Preconditions:

- `bin/doctor` reports `doctor: ok`.
- Signed in as `verify.founder@photostore.local`. The sidebar includes `Admin`.
- No account `verify.user@photostore.local` unless this run is reusing one.

- **Open admin.** Choose sidebar `Admin`. Chrome heading `Admin Panel`. Page heading `Manage accounts`. Eyebrow `Users`.
- **Founder row.** The table lists `verify.founder@photostore.local` with badge `Founder`. That row has no `Edit` or `Delete` button.
- **Create user.** Choose `Add user`. Dialog title `Add user`. Fill Email `verify.user@photostore.local`, Password `VerifyUser1!`, Confirm password `VerifyUser1!`. Leave Storage (MB) at `25600`. Role `User`. Choose `Create user` (may read `Creating...`). The table shows that email with badge `User` and `Edit` / `Delete`.
- **Persistence.** Reload `/admin` or move to Photos and back to Admin. `verify.user@photostore.local` is still listed.
- **Gate (optional second account).** Sign out, then sign in as `verify.user@photostore.local` / `VerifyUser1!`. Sidebar has no `Admin` link. Opening `$APP_URL/admin` lands on `/` (`My Photos`).
- **Proof.** Capture the table with founder and the new user. Write `evidence/admin-users/` and name `admin-create`.

## Gotchas

- Only founder and admin can open this page. A 404 or empty chrome means the session is a regular user or signed out.
- Do not delete the founder (the UI does not offer it). Do not delete `verify.user@photostore.local` if a later step still needs the gate check.
- Pagination appears when there are more than 10 users. The status reads `Page N of M`.
- Creating a user does not sign you out. Stay on `/admin` as founder unless you are proving the gate.
