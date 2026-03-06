# API Route Service Mirror

This directory mirrors `app/api/**` (excluding NextAuth) so App Router route files stay thin.

Guidelines:
- `app/api/**/route.ts` should only re-export `runtime` and HTTP method handlers from here.
- Request parsing, auth checks, response shaping, and domain orchestration live here or in deeper domain services.
- Shared helpers for a route subtree should live under this mirror, not under `app/api`.

This keeps transport files in `app/api` declarative while preserving route-level behavior.
