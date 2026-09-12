# Albums

Albums let a user group library items into named collections, open one, edit its details, and delete the album without deleting the photos.

## Sub-features

- `albums-empty` shows `No albums yet` with `Create your first album`.
- `albums-create` saves a name (description optional) from the top-bar or empty-state button.
- `albums-open` opens `/albums/$albumId` from the album card.
- `albums-edit` changes the name from `Actions for <album>` → `Edit`.
- `albums-delete` removes the album after `Delete album` and leaves photos in Photos.

## How to get to it (user POV)

- Choose sidebar `Albums`.
- Choose `Create album` in the top bar (visible on `/albums`).
- Choose `Create your first album` on the empty albums page.
- Choose an album card, or `Actions for <name>` → `Edit` / `Delete`.

## Driving it with the Cursor browser

Preconditions:

- `bin/doctor` reports `doctor: ok`.
- Signed in as the verify founder.
- No album named `Verify Trip` unless the recipe is editing or deleting that leftover.

- **Empty or list.** Open `$APP_URL/albums` via the sidebar `Albums` link (`aria-current="page"`). Chrome heading `Albums`. Either `No albums yet` or a grid of album names.
- **Open create.** Choose `Create album` (top bar, `aria-label="Create album"`) or `Create your first album`. Dialog title `Create album`. Focus is in textbox `Name`.
- **Create.** Fill Name `Verify Trip` and Description `Verification fixture`. Leave Cover empty. Choose `Create album` (may read `Creating...`). A toast `Album created.` appears. The card heading `Verify Trip` is on `/albums`.
- **Cancel.** Re-open create, type `Discard me`, choose `Cancel`. No `Discard me` card.
- **Open album.** Choose the `Verify Trip` card link. Breadcrumb `Albums` / `Verify Trip`. Page heading `Verify Trip`. Empty title `This album is empty` when no media has been added.
- **Edit.** Back on `/albums`, choose `Actions for Verify Trip` → `Edit`. Dialog title `Edit album`. Change Name to `Verify Trip Edited`. Choose `Save changes`. The card heading updates. Re-open the card to confirm the heading persisted.
- **Delete.** Choose `Actions for Verify Trip Edited` → `Delete`. Dialog title `Delete album`. Choose `Delete album`. The card is gone. Photos that were only in that album still appear on `/` if any existed.
- **Add-to-album from Photos.** When both a photo and an album exist, on `/` choose `Actions for <filename>` → `Add to album`, then choose the album. Toast `Photo added to album.` The photo appears inside the album route.
- **Proof.** Capture the create dialog, the list containing `Verify Trip`, and the open album heading. Write `evidence/albums/` and name `albums-create`.

## Gotchas

- Cover is a file input. Skip choosing a cover in this harness; name-only create is a complete create path.
- Album names are trimmed. Assert the rendered heading, not the raw input.
- `Create album` in the top bar is omitted on Photos. Use `/albums` first.
- Deleting an album does not delete media. If you need that, use [Photos library](./photos-library.md) delete.
- Leftover `Verify Trip` from a prior run is not a failure. Edit or delete it, or pick a unique name and record it in `notes.md`.
