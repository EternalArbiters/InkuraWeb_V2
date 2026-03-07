# Perf Refactor Stage 08 — Final hardening

## Goal
Close the remaining easy request overhead that still happens after the big server-page refactor, and add a lightweight final audit command for future baselines.

## Changes
- Seed reader floating chapter-like state from the server-rendered chapter payload so `FloatingActions` does not need an extra `/api/chapters/:id` fetch on first mount in reader routes.
- Preload viewer reading-list options into `AddToListButton` on the public work detail page so opening the popover does not always trigger an initial `/api/lists` round trip.
- Cache `listReadingListsForViewer()` per request and expose a lite shape for UI seeds.
- Fix the baseline scanner so `apiJson` counts inside `app/` only reflect actual `app/**` files.
- Add `npm run refactor:stage8` as a lightweight final audit for future refactor baselines.

## Expected effect
- Reader routes avoid one extra request on first paint for the floating like button.
- Work detail avoids one extra request when a signed-in viewer opens the add-to-list chooser.
- Stage metrics are easier to trust because the baseline scanner no longer over-counts `apiJson()` from outside `app/**`.
