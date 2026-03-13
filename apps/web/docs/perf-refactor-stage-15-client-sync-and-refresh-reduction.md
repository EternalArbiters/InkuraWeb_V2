# Stage 15 — client sync and refresh reduction

Paket 4 menurunkan `router.refresh()` in area interaksi light already punya local state.

## What was synchronized without a full refresh

- work like / favorite
- work bookmark
- work rating
- chapter like (including floating reader action)
- studio works grid delete / publish toggle
- navigasi after create/edit form studio and create list

## Prinsip

- use shared client state for interaksi that tampil in several komponen sekaligus
- patch local state from response mutation
- use `router.push()` without `router.refresh()` when target page next will fetch data sendiri

## Notes

There are still areas that were intentionally not cleaned up in this pass, especially mutations that really change the large page shell and still need a full server-state refresh.


## Final sweep continuean

This follow-up pass removes the remaining `router.refresh()` calls in list owner controls and the chapter/comic pages manager with local state patching, so the remaining interaction areas no longer depend on a full refresh.
