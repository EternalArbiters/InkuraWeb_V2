# Perf Refactor Stage 10 - Client Fetch Optimizations (Tahap E)

Tahap E memotong fetch client yang terlalu agresif tanpa mengubah fitur utama.

## Yang diubah

### 1. Cache/dedupe client ringan
- Tambah `apps/web/lib/clientResourceCache.ts`.
- Fungsinya:
  - seed initial data dari server-rendered props
  - dedupe request GET yang identik di client
  - short TTL cache untuk menghindari mount refetch berulang
  - local cache mutation setelah mutation berhasil

### 2. Comments
- `useComments` sekarang memakai cache key berdasarkan scope/target/sort.
- initial comments disimpan sebagai seed cache.
- refresh manual bisa `force: true` jika perlu.
- `CommentSection` tidak lagi memanggil `router.refresh()` untuk submit/reply/edit/delete/hide/pin.
- Refresh penuh diganti dengan local patch atau fetch komentar terarah.

### 3. Reviews
- `useReviews` sekarang memakai cache per `workId + sort`.
- initial helpful reviews di-seed ke cache.
- submit/edit review tidak lagi selalu refetch list + refresh page.
- state list review dan summary rating diperbarui langsung dari response mutation.
- helpful toggle tetap lokal, lalu list di-sort ulang saat perlu.
- API patch review sekarang mengembalikan `ratingAvg` dan `ratingCount` agar UI tidak perlu refresh penuh.

### 4. Add-to-list
- `AddToListButton` sekarang memakai cache viewer reading lists.
- membuka dialog/list picker tidak selalu fetch ulang.
- setelah add item berhasil, count list di-update lokal.

### 5. Studio series manager
- `StudioSeriesManagerClient` tidak lagi GET refresh penuh setelah setiap mutation.
- create/rename/add/remove/move/reorder sekarang patch state lokal langsung.
- snapshot terbaru juga di-seed ke client cache.

### 6. Reading list owner removal
- `listWorksGrid` tidak lagi `router.refresh()` setelah remove item.
- item dihapus langsung dari local state grid.

### 7. Studio works lite helper
- `useMyWorksLite` sekarang memakai short-lived cache agar mount berulang tidak selalu hit API.

## Dampak yang diharapkan
- mount refetch turun di area interaktif yang sering dipakai
- lebih sedikit `router.refresh()` penuh setelah mutation ringan
- UX terasa lebih responsif karena UI dipatch lokal lebih dulu
- request client identik tidak menembak API berulang dalam jangka sangat dekat

## Catatan
- Tahap ini belum mengganti semua client fetch di repo.
- Fokusnya hanya area yang paling jelas agresif dan aman dioptimalkan tanpa mengubah perilaku inti aplikasi.
