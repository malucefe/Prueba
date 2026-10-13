# Feature: Auth roles (user/admin) + complete dev seed

**Objective:** Add real `role` support (user/admin) to the Caudo backend and seed both an admin and a regular user with transactions, goals, and recommendations so the whole flow can be exercised locally.

**Problem:** The User entity has no role field and no admin concept exists. Dev seed only inserts categories.

**Scope:**
- `role` column on User (enum, default `user`); JWT payload includes `role`; jwt.strategy surfaces it.
- `@Roles()` decorator + `RolesGuard`; admin-only `GET /users` (findAll) endpoint.
- Register continues to create plain `user` accounts only.
- Seed: admin@caudo.dev, user@caudo.dev (+ maybe a second regular user), transactions, goals, recommendations. Idempotent by count checks like existing categories seed.

**Out of scope:** admin UI in frontend, refresh tokens, role management endpoints.

**Forecast:** ~250-350 authored changed lines.

## Tasks

- [ ] 1. Roles in domain: entity field, jwt payload, strategy, decorator + guard, admin users endpoint (with unit tests first)
- [ ] 2. Seed service: users, transactions, goals, recommendations seeders (Categories ids reused)
- [ ] 3. Boot backend, verify seed ran (DB counts, login as admin/user via Swagger), record evidence

## Verification
- `cd caudo-back && npm.cmd test` (Jest) — new guard/strategy tests green
- Backend boot log shows seed counts; DB has users=2+, transactions>0, goals>0, recommendations>0
- `POST /auth/login` works for admin and user; `GET /users` returns 403 for user role, 200 for admin

## Route declarations
- Task 1+2: delegated direct writer (2+ non-trivial files). Trigger: writer trigger.
- Task 3: per-action worker or inline bounded check.

## Progress / Evidence
- Task 1+2 (roles + seed): DONE via delegated writer. Typecheck OK (`npx.cmd tsc --noEmit`). Unit tests: 27/27 green after fixing `auth.service.spec.ts` (create/sign/result payloads now include `role: 'user'`).
- Task 3: DONE. Backend boot logged seed skips idempotently; DB has users(2), transactions(8), goals(2), recommendations(3). `POST /api/auth/login` returns JWT with `role` claim; `GET /api/users` → 200 for admin (2 users), 403 for regular user.
- ALTERNATIVE: git identity not configured; user chose NO commits. Local changes remain uncommitted on `main`.
