# AGENTS.md

## Monorepo structure

npm workspaces with 3 packages:
- `shared-kernel/` — DDD base classes (AggregateRoot, Entity, ValueObject, DomainEvent). Published as `@suenos-dev/shared-kernel`.
- `apps/api/` — NestJS backend (`@suenos-dev/api`)
- `apps/web/` — Next.js 14 frontend (`@suenos-dev/web`)

## Build order (critical)

`shared-kernel` must be built before the API or web can resolve `@suenos-dev/shared-kernel`. The API's `dev:api` script handles this automatically; `dev:web` does not depend on it.

```
npm run build:shared   # always first
npm run dev:api        # builds shared-kernel then starts NestJS (port 3001)
npm run dev:web        # Next.js dev server (port 3000)
```

Full production build: `npm run build` (shared -> api -> web, in order).

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev:api` | Build shared-kernel, then `nest start --watch` on port 3001 |
| `npm run dev:web` | `next dev` on port 3000 |
| `npm run build` | Full build: shared-kernel -> api -> web |
| `npm run lint` | ESLint from root (covers all workspaces) |
| `npm run docker:up` | Start Postgres, Redis, MinIO via docker-compose |
| `npm run docker:down` | Stop all Docker services |
| `npm run docker:dev` | Full stack in Docker (api, web, traefik, postgres, redis, minio) |

There are no test or typecheck scripts defined at any level.

## Dev prerequisites

- Start infra first: `docker compose -f infra/docker-compose.yml up -d postgres redis minio`
- Copy `.env.example` to root `.env`. API also has its own `.env` in `apps/api/`. Web has `.env.local`.
- Node >= 20

## Infrastructure (Docker Compose)

Services: Postgres 16 (port 5432), Redis 7 (port 6379), MinIO (ports 9000/9001), API (port 3001), Web (port 3000), Traefik (ports 80/443/8080). Config at `infra/docker-compose.yml`.

## Backend architecture (NestJS)

DDD + Hexagonal architecture. Each bounded context lives in `apps/api/src/contexts/<name>/` with this structure:

```
<name>/
├── <name>.module.ts
├── domain/          # entities, value objects, repository ports (interfaces)
├── application/     # use cases + event handlers
├── infrastructure/  # port implementations (typeorm/, adapters)
└── interfaces/      # controllers + DTOs
```

**Rules:**
- Domain layer must NOT import NestJS, TypeORM, or SDKs — only defines ports.
- Cross-context communication via domain events (EventEmitter2).
- Global prefix `/api` is set in `main.ts`.
- Swagger docs at `/docs`. Health check at `/health`.
- TypeORM `synchronize: true` is enabled (dev only).

8 contexts: identity, catalog, content-delivery, assessment, certification, payments, enrollment, notifications.

## Frontend architecture (Next.js 14)

App Router (`src/app/`). Key routes:
- `/` — landing
- `/cursos/[slug]` — public course page
- `/checkout` — Stripe checkout
- `/aprender/[cursoId]` — video player + modules
- `/aprender/[cursoId]/quiz` — quiz
- `/certificados/[id]` — public certificate verification
- `/auth`, `/admin`, `/dashboard`, `/instructor`, `/perfil` — authed sections

`output: 'standalone'` in next.config (Docker-ready). Path alias `@/*` maps to `./src/*`.

## Shared kernel

DDD base types in `shared-kernel/src/`: `AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`. Build with `tsc`. The API tsconfig resolves `@suenos-dev/shared-kernel` to `shared-kernel/dist`.

## Gotchas

- API `synchronize: true` auto-creates DB schema — do not use in production without migrations.
- Stripe keys in `.env.example` are test/placeholder values.
- `dev:web` does NOT auto-rebuild shared-kernel; if you change shared-kernel types, run `npm run build:shared` manually.
- Web uses `@/*` path alias; API uses `@suenos-dev/shared-kernel` for the shared package.
