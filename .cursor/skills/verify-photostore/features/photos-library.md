# Photos library

The photos library is the signed-in home. It shows an empty state before any media, then date-grouped tiles that open a preview and can be deleted.

## Sub-features

- `photos-empty` shows the empty library when the user has no media.
- `photos-nav` reaches `/` from the sidebar `Photos` link.
- `photos-upload-control` exposes the `Upload photos` button on `/` (file completion is out of harness).
- `photos-open` opens a tile into a viewer titled with the file name.
- `photos-delete` removes an item from the library after confirm.

## How to get to it (user POV)

- Land on `/` after setup or sign-in.
- Choose the sidebar `Photos` link.
- Choose `Upload` / `Upload photos` in the top bar (not shown on album routes).
- Choose a tile (`Open <filename>`) or its `Actions for <filename>` menu.

## Driving it with the Cursor browser

Preconditions:

- `bin/doctor` reports `doctor: ok`.
- Signed in as the verify founder (see [Sign in and out](./sign-in.md)).
- For `photos-empty`, the founder library has no media. A fresh volume after setup is enough.

- **Empty state.** Open `$APP_URL/`. Chrome heading `My Photos`, page heading `Photos`, empty title `Add your first photos`. Description mentions the Upload button.
- **Upload control.** Choose `Upload photos`. A native file picker may appear. The harness cannot attach a disk file; record `photos-upload-control` as skipped-at-picker and do not POST media through the API as a stand-in.
- **Sidebar entry.** Open `/albums`, then choose sidebar `Photos`. `aria-current="page"` is on `Photos`. The URL is `/`.
- **Open tile.** When media exists, choose the button `Open <filename>`. A dialog titled with that filename appears. Choose `Close image` to dismiss.
- **Delete tile.** Choose `Actions for <filename>`, then `Delete`. Confirm dialog title `Delete photo`. Choose `Delete photo`. A toast `Photo deleted.` appears. The tile is gone after reload of `/`. If it was the last item, `Add your first photos` returns.
- **Proof.** For the empty library, capture heading + empty title. If tiles exist, capture the grid and the open viewer. Write `evidence/photos-library/` and name the sub-feature actually driven.

## Gotchas

- `Upload` is hidden on `/albums` and `/albums/$albumId`. Looking for it there is a false failure.
- Tiles load thumbnails lazily. Wait for the image or the `Video` label, not a skeleton, before screenshotting a grid.
- Delete is permanent for that user. Prefer deleting media this run uploaded. Do not delete the user's non-verify library; this map is only for the verify stack.
- Infinite scroll uses a sentinel. A short library does not show `Loading more...`.
