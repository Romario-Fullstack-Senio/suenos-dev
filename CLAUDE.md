# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This repo also has an `AGENTS.md` with overlapping content (used by other coding agents). Keep both in sync when architecture or commands change.

## Commands

npm workspaces monorepo: `shared-kernel`, `apps/api` (`@suenos-dev/api`), `apps/web` (`@suenos-dev/web`).

```bash
npm run build:shared   # build shared-kernel — must happen before api/web can resolve @suenos-dev/shared-kernel
npm run dev:api        # builds shared-kernel, then nest start --watch on port 3001
npm run dev:web        # next dev on port 3000 (does NOT rebuild shared-kernel first)
npm run build          # full build: shared-kernel -> api -> web, in order
npm run lint           # eslint across all workspaces
npm run docker:up      # start Postgres, Redis, MinIO via docker-compose
npm run docker:down
npm run docker:dev     # full stack in Docker (api, web, traefik, postgres, redis, minio)
```

Infra must be up before running the API/web locally: `docker compose -f infra/docker-compose.yml up -d postgres redis minio`. Env files: root `.env` (from `.env.example`), `apps/api/.env`, `apps/web/.env.local`.

### Tests

Unit tests exist only in `apps/api` (Jest + ts-jest, files matching `*.spec.ts`):

```bash
cd apps/api
npm test                              # all tests
npm test -- usuario.entity.spec       # single test file (matches by name)
npm test -- -t "nombre del test"      # single test by name pattern
npm run test:watch
npm run test:cov
```

There is no test or typecheck script at the root or in `apps/web`. `apps/web`'s `npm run lint` is `next lint`.

### Database migrations

TypeORM migrations (`apps/api/src/migrations/`, `synchronize: false`, `migrationsRun: true` in `app.module.ts` — pending migrations apply automatically on API boot):

```bash
cd apps/api
npm run migration:generate -- src/migrations/DescriptiveName   # diff current entities vs DB, writes a migration
npm run migration:run                                          # apply pending migrations manually (boot already does this)
npm run migration:revert                                       # undo the last applied migration
```

`migration:generate` diffs against whatever `DATABASE_NAME` currently points to — never generate against a DB with real data if you want the migration to contain the actual `CREATE TABLE`s (it diffs to zero if the DB already matches). Generate against an empty scratch DB instead, then let `migrationsRun: true` (or a manual `migration:run`) apply it to the real one.

End-to-end QA scripts (Playwright-driven, hit a running local stack) live in `tests/`:
```bash
node tests/qa-test.mjs        # general QA pass
node tests/test-romario.mjs   # specific-user QA pass
```

## Architecture

DDD + Hexagonal architecture on a NestJS backend, Next.js 14 (App Router) frontend, sharing DDD primitives from `shared-kernel/` (`AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`; built with `tsc`, resolved by the API's tsconfig path mapping to `shared-kernel/dist`). Building shared-kernel before the API is not optional — it will fail to resolve `@suenos-dev/shared-kernel` otherwise, and `dev:web` never triggers that build itself.

### Bounded contexts (`apps/api/src/contexts/<name>/`)

8 contexts: `identity`, `catalog`, `content-delivery`, `assessment`, `certification`, `payments`, `enrollment`, `notifications`. Each follows the same internal layering:

```
<name>/
├── <name>.module.ts
├── domain/          # *.entity.ts, *.value-object.ts, *.repository.port.ts (interfaces + DI tokens), events/
├── application/     # use cases + event handlers
├── infrastructure/  # port implementations: typeorm/, email/, queue/, and adapters (MinIO, Stripe, PDF, LinkedIn...)
└── interfaces/      # HTTP controllers + DTOs
```

Rules that matter when adding or changing code here:
- `domain/` must never import NestJS, TypeORM, or any SDK — it only defines ports (interfaces) and DI tokens; `infrastructure/` implements them.
- Cross-context communication goes through domain events via `EventEmitter2` (see `apps/api/src/common/event-bus.ts`), not direct imports between contexts.
- Aggregate roots extend `AggregateRoot<string>` from shared-kernel with a private `props` field, and expose business methods named after the domain operation rather than generic setters.
- Value objects are immutable.
- Global API prefix `/api` and Swagger setup live in `apps/api/src/main.ts`; docs served at `/docs`, health check at `/health`.
- TypeORM `synchronize` is disabled — schema changes go through migrations (`apps/api/src/migrations/`, see "Database migrations" above). `migrationsRun: true` applies pending migrations automatically on API boot.

### Notifications flow (event-driven, cross-cutting example)

`Publicar curso` → `CursoPublicado` domain event → handler saves a row to `notificaciones` and enqueues an email job on Bull (batched, 50 at a time) → a Bull processor sends via the email adapter chain. Bull retries: 3 attempts, exponential backoff (2s).

Email adapter fallback order (first configured wins): **Resend → SendGrid → Nodemailer** (Nodemailer/SMTP is the dev fallback via Mailtrap). OAuth strategies (Google/GitHub) are similarly conditional — missing env vars means the strategy returns null instead of crashing at boot.

### Frontend (`apps/web/src/app/`, Next.js 14 App Router)

Path alias `@/*` → `apps/web/src/*`. `output: 'standalone'` in `next.config.mjs` for Docker builds. Route auth boundaries are enforced server-side by `apps/web/src/middleware.ts` (redirects unauthenticated visits to protected prefixes, and role-gates `/admin`/`/instructor`) — new protected routes must be added to its `PROTECTED_PREFIXES`/`config.matcher`. Public routes: `/`, `/cursos`, `/cursos/[slug]`, `/certificados/[id]` (verification), `/auth/*`, `/carrito` (cart is client-side/localStorage via `CartContext`, no login needed until checkout). Authenticated: `/dashboard` (estudiante), `/checkout`, `/aprender/[cursoId]` (+ `/quiz`, requires enrollment), `/perfil`, `/favoritos` (wishlist, server-persisted per user), `/instructor` (instructor role), `/admin` (admin role).

### Auth: tokens, refresh, verification

Login/OAuth/refresh return three JWTs, all signed with `JWT_SECRET` (must be identical in `apps/api/.env` and `apps/web/.env.local` — the latter isn't `NEXT_PUBLIC_`, only readable server-side/in middleware):
- `token` — 15min access token, sent as `Authorization: Bearer` on every API call (stored in `localStorage`).
- `refreshToken` — opaque random value, 30d, hashed (sha256) and tracked in the `refresh_tokens` table (`RefreshToken` aggregate in `identity/domain`) so it's revocable; rotated on every use (`POST /auth/refresh`) and revoked on `POST /auth/logout` or a password reset. `apps/web/src/lib/api.ts`'s `request()` auto-refreshes once on a 401 and retries the original call.
- `sessionToken` — 30d JWT with `purpose: 'session-hint'`, stored in a non-httpOnly `session_token` cookie purely so `middleware.ts` can verify it (via `jose`) and gate routes server-side. `JwtStrategy` explicitly rejects any token carrying `purpose: 'session-hint'` as a bearer token — it must never authorize a real API call.

Email verification (`Usuario.emailVerificado`, `POST /auth/verify-email`, `POST /auth/resend-verification`) and password reset (`POST /auth/forgot-password`, `POST /auth/reset-password`) don't block login — unverified users can use the app; `PerfilForm` shows a banner with a resend button. OAuth accounts start pre-verified (the provider already confirmed the email). Both flows fire through `EventBus`/`@OnEvent` handlers in `notifications/application/` (`enviar-email-verificacion.handler.ts`, `enviar-email-reset-password.handler.ts`), same pattern as `CursoPublicado`/`CursoComprado`. `EMAIL_SENDER` now lives in `common/email/email.module.ts` (not `notifications/`) specifically so `identity` can use it without a circular module import (`notifications.module.ts` already imports `IdentityModule`).

Design system: dark theme, CSS custom properties `--suenos-midnight`, `--suenos-deep`, `--suenos-violet`, `--suenos-cyan`, `--suenos-gold`; fonts Space Grotesk (display) / Inter (body) / JetBrains Mono (code).

### Infra

Docker Compose (`infra/docker-compose.yml` dev, `infra/docker-compose.prod.yml` prod) runs Postgres 16, Redis 7, MinIO, and (in the `docker:dev` full-stack profile) the API, web, and Traefik. Caddy fronts production instead of Traefik (see `infra/Caddyfile`). CI/CD is two GitHub Actions workflows: `build-and-push.yml` (build Docker images, push to GHCR on push to `main`) and `deploy.yml` (deploy via self-hosted runner after build). See [README-DEPLOY.md](README-DEPLOY.md) for the full deploy procedure.
