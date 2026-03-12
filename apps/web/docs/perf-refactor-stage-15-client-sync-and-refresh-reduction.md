# Stage 15 — client sync and refresh reduction

Paket 4 menurunkan `router.refresh()` in area interaksi ringan already punya local state.

## Yang dcontentnkronkan without refresh penuh

- work like / favorite
- work bookmark
- work rating
- chapter like (terenter floating reader action)
- studio works grid delete / publish toggle
- navigasi after create/edit form studio and create list

## Prinsip

- gunakan shared client state for interaksi that tampil in several komponen sekaligus
- patch local state from response mutation
- gunakan `router.push()` without `router.refresh()` saat target page berikutnya akan fetch data sendiri

## Catatan

Masih there is area that intentionally not yet disapu pada pass this, especially mutation that memang mengubah shell page besar and still butuh refresh server state penuh.


## Final sweep continuean

Pass continuean this removing sisa `router.refresh()` pada list owner controls and chapter/comic pages manager with local state patch, sehingga area interaksi that still tersisa kini not lagi bergantung pada full refresh.
