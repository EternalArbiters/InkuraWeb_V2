# Perf Refactor Stage 10 - Client Fetch Optimizations (Stage E)

Stage E memotong fetch client that terthen agresif without changing features main.

## What changed

### 1. Cache/dedupe client light
- Tambah `apps/web/lib/clientResourceCache.ts`.
- Fungsinya:
  - seed initial data from server-rendered props
  - dedupe request GET that identical in client
  - short TTL cache to avoid mount refetch berulang
  - local cache mutation after mutation successful

### 2. Comments
- `useComments` now uses cache key berdasarkan scope/target/sort.
- initial comments dcontentmpan as seed cache.
- refresh manual can `force: true` if need.
- `CommentSection` not lagi calls `router.refresh()` for submit/reply/edit/delete/hide/pin.
- Full refresh was replaced with local patching or targeted comment fetching.

### 3. Reviews
- `useReviews` now uses cache per `workId + sort`.
- initial helpful reviews in-seed to cache.
- submit/edit review not lagi sethen refetch list + refresh page.
- state list review and summary rating dipernewi directly from response mutation.
- helpful toggle still local, then list in-sort again when need.
- API patch review now returning `ratingAvg` and `ratingCount` so that UI not need full refresh.

### 4. Add-to-list
- `AddToListButton` now uses cache viewer reading lists.
- membuka dialog/list picker not sethen fetch again.
- after add item successful, count list in-update local.

### 5. Studio series manager
- `StudioSeriesManagerClient` not lagi GET full refresh after each mutation.
- create/rename/add/remove/move/reorder now patch state local directly.
- snapshot ternew juga in-seed to client cache.

### 6. Reading list owner removal
- `listWorksGrid` not lagi `router.refresh()` after remove item.
- item dihapus directly from local state grid.

### 7. Studio works lite helper
- `useMyWorksLite` now uses short-lived cache so that mount berulang not sethen hit API.

## Dampak that diharapkan
- mount refetch reduced in area interactive that often used
- fewer full `router.refresh()` calls after light mutations
- UX terasa more responsif because UI dipatch local more first
- request client identical not menembak API berulang dalam jangka sangat dekat

## Notes
- This stage not yet mengganti all client fetch in repo.
- Fokusnya only area that most clear agresif and safe dioptimalkan without changing perilaku inti aplikasi.
