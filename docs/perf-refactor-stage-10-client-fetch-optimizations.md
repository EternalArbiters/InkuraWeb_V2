# Perf Refactor Stage 10 - Client Fetch Optimizations (Tahap E)

Tahap E memotong fetch client that terthen agresif without mengubah features main.

## Yang diubah

### 1. Cache/dedupe client ringan
- Tambah `apps/web/lib/clientResourceCache.ts`.
- Fungsinya:
  - seed initial data from server-rendered props
  - dedupe request GET that identik in client
  - short TTL cache to avoid mount refetch berulang
  - local cache mutation after mutation successful

### 2. Comments
- `useComments` now memakai cache key berdasarkan scope/target/sort.
- initial comments dcontentmpan sebagai seed cache.
- refresh manual can `force: true` if perlu.
- `CommentSection` not lagi calls `router.refresh()` for submit/reply/edit/delete/hide/pin.
- Refresh penuh diganti with local patch or fetch comments terarah.

### 3. Reviews
- `useReviews` now memakai cache per `workId + sort`.
- initial helpful reviews in-seed to cache.
- submit/edit review not lagi sethen refetch list + refresh page.
- state list review and summary rating dipernewi directly from response mutation.
- helpful toggle still local, then list in-sort again saat perlu.
- API patch review now mengembalikan `ratingAvg` and `ratingCount` so that UI not perlu refresh penuh.

### 4. Add-to-list
- `AddToListButton` now memakai cache viewer reading lists.
- membuka dialog/list picker not sethen fetch again.
- after add item successful, count list in-update local.

### 5. Studio series manager
- `StudioSeriesManagerClient` not lagi GET refresh penuh after setiap mutation.
- create/rename/add/remove/move/reorder now patch state local directly.
- snapshot ternew juga in-seed to client cache.

### 6. Reading list owner removal
- `listWorksGrid` not lagi `router.refresh()` after remove item.
- item dihapus directly from local state grid.

### 7. Studio works lite helper
- `useMyWorksLite` now memakai short-lived cache so that mount berulang not sethen hit API.

## Dampak that diharapkan
- mount refetch turun in area interactive that sering used
- more sedikit `router.refresh()` penuh after mutation ringan
- UX terasa more responsif because UI dipatch local more first
- request client identik not menembak API berulang dalam jangka sangat dekat

## Catatan
- This stage not yet mengganti all client fetch in repo.
- Fokusnya only area that most clear agresif and safe dioptimalkan without mengubah perilaku inti aplikasi.
