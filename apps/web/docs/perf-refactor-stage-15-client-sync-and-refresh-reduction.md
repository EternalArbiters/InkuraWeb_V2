# Stage 15 — client sync and refresh reduction

Paket 4 menurunkan `router.refresh()` di area interaksi ringan yang sudah punya local state.

## Yang disinkronkan tanpa refresh penuh

- work like / favorite
- work bookmark
- work rating
- chapter like (termasuk floating reader action)
- studio works grid delete / publish toggle
- navigasi setelah create/edit form studio dan create list

## Prinsip

- gunakan shared client state untuk interaksi yang tampil di beberapa komponen sekaligus
- patch local state dari response mutation
- gunakan `router.push()` tanpa `router.refresh()` saat target halaman berikutnya akan fetch data sendiri

## Catatan

Masih ada area yang sengaja belum disapu pada pass ini, terutama mutation yang memang mengubah shell halaman besar dan masih butuh refresh server state penuh.


## Final sweep lanjutan

Pass lanjutan ini menghapus sisa `router.refresh()` pada list owner controls dan chapter/comic pages manager dengan local state patch, sehingga area interaksi yang masih tersisa kini tidak lagi bergantung pada full refresh.
