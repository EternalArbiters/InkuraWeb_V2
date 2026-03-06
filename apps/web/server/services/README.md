# server/services

Tempat business logic dan handler service yang dipanggil oleh route API.

Struktur utamanya sekarang dibagi dua:

- `server/services/<domain>/*`
  - berisi domain logic reusable, misalnya comments, works, studio, notifications, dan helper business rules.
- `server/services/api/**/route.ts`
  - mirror tree dari `app/api/**/route.ts`
  - setiap file route API tipis hanya melakukan `apiRoute(...)` dan mendelegasikan request ke handler service di sini.

Dengan pola ini, surface route API sudah full service-backed tanpa mengubah response shape atau fitur runtime.
