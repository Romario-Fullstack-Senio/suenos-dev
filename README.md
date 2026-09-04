# Sueños Dev

**Donde los sueños se convierten en código.**

Plataforma de e-learning para ingeniería de sistemas con cursos, streaming de video, quiz, certificados verificables, y un sistema de notificaciones event-driven. Diseño dark-theme con identidad visual propia.

## Arquitectura

Monorepo con **NestJS** (backend) + **Next.js 14** (frontend), organizado en Bounded Contexts siguiendo **DDD + Arquitectura Hexagonal**.

```
suenos-dev/
├── shared-kernel/          # Paquete compartido: Entity, AggregateRoot, ValueObject, DomainEvent
├── apps/
│   ├── api/                # NestJS backend (8 bounded contexts)
│   └── web/                # Next.js 14 App Router + Tailwind CSS
├── infra/                  # Docker Compose, Caddyfile, .env.example
├── tests/                  # Scripts de QA end-to-end
└── .github/workflows/      # CI/CD: build, push, deploy
```

### Bounded Contexts

| Contexto | Subdominio | Responsabilidad |
|----------|-----------|-----------------|
| identity | Core | Usuarios, roles, JWT auth, OAuth (Google, GitHub) |
| catalog | Core | Cursos, módulos, lecciones |
| content-delivery | Core | Streaming video (HLS), progreso |
| assessment | Core | Quiz de evaluación |
| certification | Core | Certificados PDF verificables |
| payments | Supporting | Stripe Checkout, PaymentIntents, webhooks |
| enrollment | Supporting | Inscripciones, acceso a cursos |
| notifications | Supporting | Emails (event-driven) + notificaciones en plataforma (Bull queue) |

### Convención de Capas

Cada bounded context en `apps/api/src/contexts/<nombre>/` tiene:

```
<nombre>/
├── <nombre>.module.ts          # NestJS module
├── domain/                     # NUNCA importa NestJS, TypeORM, SDKs
│   ├── *.entity.ts             # Aggregate Root / Entity
│   ├── *.value-object.ts       # Value Objects inmutables
│   ├── *.repository.port.ts    # Puertos (interfaces) + tokens DI
│   └── events/                 # Eventos de dominio
├── application/                # Casos de uso + event handlers
├── infrastructure/             # Implementación de puertos
│   ├── typeorm/                # ORM entities + repositorios
│   ├── email/                  # Adaptadores: Resend → SendGrid → Nodemailer
│   ├── queue/                  # Bull processors
│   └── <adapter>/              # MinIO, Stripe, PDF, LinkedIn, etc.
└── interfaces/                 # Controladores HTTP + DTOs
```

**Reglas:**
- El dominio solo define interfaces (puertos); infrastructure las implementa.
- La comunicación entre contextos es por eventos de dominio (EventEmitter2).
- Cada Aggregate Root expone métodos de negocio con nombres de dominio.
- `AggregateRoot<string>` con `private props` field separado.
- Value Objects inmutables.

## Stack Tecnológico

### Backend

| Componente | Tecnología |
|------------|-----------|
| Framework | NestJS 10 |
| ORM | TypeORM (PostgreSQL 16) |
| Auth | JWT + Passport (local, Google OAuth, GitHub OAuth) |
| Pagos | Stripe SDK (PaymentIntents, Checkout, Webhooks) |
| Cola de mensajes | Bull + Redis |
| Email | Resend > SendGrid > Nodemailer (fallback) |
| Video | HLS streaming + FFmpeg transcoding |
| PDF | PDFKit (certificados) |
| Monitoreo | Sentry (error tracking + profiling) |
| API docs | Swagger |
| Rate limiting | @nestjs/throttler |

### Frontend

| Componente | Tecnología |
|------------|-----------|
| Framework | Next.js 14 (App Router) |
| Estilos | Tailwind CSS 3.4 |
| Formularios | React Hook Form + Zod |
| Pago | @stripe/react-stripe-js |
| Video | HLS.js |
| Iconos | Lucide React |
| Notificaciones | Sonner (toast) |
| Animaciones | Framer Motion |
| Monitoreo | Sentry (client + server) |

### Infraestructura

| Componente | Tecnología |
|------------|-----------|
| Base de datos | PostgreSQL 16 |
| Cache/Colas | Redis 7 |
| Almacenamiento | MinIO (S3-compatible) |
| Reverse proxy | Caddy (producción) / Traefik (desarrollo) |
| Containers | Docker multi-stage builds |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| Deploy | Self-hosted runner |

## Prerrequisitos

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose
- PostgreSQL 16 (local o Docker)
- Redis (local o Docker)

## Arranque Rápido

### 1. Infraestructura local

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis minio
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Copiar variables de entorno

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env  # si existe
```

### 4. Base de datos

```bash
# Crear la base de datos (si no existe)
psql -U postgres -c "CREATE DATABASE \"suenos-dev\";"
```

> TypeORM `synchronize: true` crea las tablas automáticamente al iniciar la API.

### 5. Desarrollo

```bash
# Terminal 1: Backend (construye shared-kernel primero)
npm run dev:api

# Terminal 2: Frontend
npm run dev:web
```

- API: http://localhost:3001/api
- API Docs: http://localhost:3001/docs
- Web: http://localhost:3000
- MinIO Console: http://localhost:9001

### 6. Docker completo

```bash
npm run docker:dev
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run build:shared` | Construir shared-kernel |
| `npm run dev:api` | Backend en desarrollo (watch mode) |
| `npm run dev:web` | Frontend en desarrollo |
| `npm run build` | Build completo: shared → api → web |
| `npm run lint` | ESLint en todos los workspaces |
| `npm run docker:up` | Levantar Postgres, Redis, MinIO |
| `npm run docker:down` | Detener todos los servicios Docker |
| `npm run docker:dev` | Stack completo en Docker |
| `npm run test:api` | Tests unitarios de la API |

## Endpoints API

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registrar usuario |
| POST | `/api/auth/login` | Login y obtener JWT |
| GET | `/api/auth/google` | Iniciar OAuth con Google |
| GET | `/api/auth/github` | Iniciar OAuth con GitHub |

### Cursos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cursos` | Listar cursos publicados |
| GET | `/api/cursos/:slug` | Curso por slug |
| POST | `/api/cursos` | Crear curso (instructor) |
| PUT | `/api/cursos/:id` | Actualizar curso |
| POST | `/api/cursos/:id/publicar` | Publicar curso |
| POST | `/api/cursos/:id/modulos` | Agregar módulo |
| POST | `/api/cursos/:id/modulos/:mid/lecciones` | Agregar lección |

### Contenido

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/videos/upload` | Subir video (MinIO) |
| POST | `/api/progreso` | Registrar progreso |
| GET | `/api/progreso/:cursoId/:estudianteId` | Ver progreso |

### Evaluación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/quizzes` | Crear quiz |
| POST | `/api/quizzes/:id/resolver` | Resolver quiz |

### Pagos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ordenes` | Crear orden de pago |
| POST | `/api/stripe/webhook` | Webhook Stripe |
| GET | `/api/ordenes/:id` | Verificar estado de orden |

### Inscripciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/inscripciones/estudiante/:id` | Inscripciones del estudiante |
| POST | `/api/inscripciones` | Inscribirse a un curso |

### Certificados

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/certificados/:id/verificar` | Verificar certificado (público) |

### Notificaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notificaciones/usuario/:userId` | Notificaciones del usuario |
| GET | `/api/notificaciones/usuario/:userId/no-leidas` | Conteo de no leídas |
| PATCH | `/api/notificaciones/:id/leer` | Marcar como leída |
| PATCH | `/api/notificaciones/usuario/:userId/leer-todas` | Marcar todas como leídas |

### Salud

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |

## Frontend

### Rutas

| Ruta | Descripción | Autenticación |
|------|-------------|---------------|
| `/` | Landing page | No |
| `/cursos` | Catálogo de cursos | No |
| `/cursos/[slug]` | Página pública del curso | No |
| `/auth/login` | Iniciar sesión | No |
| `/auth/registro` | Registrarse | No |
| `/auth/callback` | Callback OAuth | No |
| `/dashboard` | Panel del estudiante | Sí (estudiante) |
| `/checkout` | Flujo de compra | Sí |
| `/aprender/[cursoId]` | Reproductor + módulos | Sí (inscrito) |
| `/aprender/[cursoId]/quiz` | Quiz de evaluación | Sí (inscrito) |
| `/certificados/[id]` | Verificación pública | No |
| `/perfil` | Mi perfil | Sí |
| `/instructor` | Panel del instructor | Sí (instructor) |
| `/admin` | Panel de administración | Sí (admin) |

### Componentes UI

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Button` | `components/ui/Button.tsx` | Botones: primary, secondary, danger, ghost |
| `Input` | `components/ui/Input.tsx` | Inputs con label y error |
| `Select` | `components/ui/Select.tsx` | Selects con opciones |
| `TextArea` | `components/ui/TextArea.tsx` | Textareas con label |
| `Header` | `components/layout/Header.tsx` | Navegación fija con glassmorphism |
| `NotificationBell` | `components/layout/NotificationBell.tsx` | Campana con badge + dropdown |

### Design System

- **Tema:** Dark mode (midnight blue + violet + cyan + gold)
- **Fuentes:** Space Grotesk (display), Inter (body), JetBrains Mono (code)
- **Iconos:** Lucide React
- **Toasts:** Sonner
- **Colores CSS:** `--suenos-midnight`, `--suenos-deep`, `--suenos-violet`, `--suenos-cyan`, `--suenos-gold`

## Variables de Entorno

### Backend (`apps/api/.env`)

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=admin
DATABASE_NAME=suenos-dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=tu-secreto-seguro
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Sentry (opcional)
SENTRY_DSN=

# Email (prioridad: Resend > SendGrid > Nodemailer)
RESEND_API_KEY=
SENDGRID_API_KEY=
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@suenos-dev.dev

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=suenos-dev
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_STRIPE_PK=pk_test_...
```

### OAuth (opcional)

```env
# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Sistema de Notificaciones

### Flujo

```
Publicar curso → CursoPublicado event → NotificarCursoNuevoHandler
    │
    ├── Guardar notificación en DB (tabla notificaciones)
    │
    └── Encolar email en Bull (batch de 50)
            │
            └── NotificacionCursoNuevoProcessor
                    │
                    └── Resend / SendGrid / Nodemailer
```

### Tabla `notificaciones`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Identificador único |
| usuario_id | UUID | Usuario destinatario |
| titulo | VARCHAR | Título de la notificación |
| mensaje | TEXT | Cuerpo del mensaje |
| tipo | VARCHAR | Tipo (curso_publicado, etc.) |
| curso_id | UUID nullable | Curso relacionado |
| leida | BOOLEAN | Estado de lectura |
| created_at | TIMESTAMP | Fecha de creación |

### Adaptadores de Email (fallback)

1. **Resend** — Si `RESEND_API_KEY` está configurado
2. **SendGrid** — Si `SENDGRID_API_KEY` está configurado
3. **Nodemailer** — Fallback con SMTP (Mailtrap en desarrollo)

## CI/CD

### GitHub Actions

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| `build-and-push.yml` | Push a `main` | Build Docker images → push a GHCR |
| `deploy.yml` | Después de build | Deploy en self-hosted runner |

### Docker

- **API:** Multi-stage build (build → production)
- **Web:** Multi-stage build (build → standalone Next.js)
- **GHCR:** `ghcr.io/romario-fullstack-senio/suenos-dev-{api,web}` (minúsculas — GHCR lo exige)

### Deploy Producción

```bash
# En el servidor
cd ~/deploy/suenos-dev/
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Ver [README-DEPLOY.md](./README-DEPLOY.md) para guía completa.

## Testing

### QA Scripts

```bash
# Test general (25/26 tests)
node tests/qa-test.mjs

# Test de usuario específico (27/27 tests)
node tests/test-romario.mjs
```

### Unit Tests (API)

```bash
cd apps/api
npm test
```

## Estructura de Datos

### Entidades Principales

- **Usuario** — id, nombre, email, password_hash, rol, auth_provider, provider_id
- **Curso** — id, instructor_id, titulo, slug, descripcion, precio, publicado
- **Modulo** — id, curso_id, titulo, orden
- **Leccion** — id, modulo_id, titulo, tipo, url, orden
- **Inscripcion** — id, estudiante_id, curso_id, fecha_inscripcion, activa
- **Orden** — id, estudiante_id, curso_id, monto, estado, stripe_payment_intent_id
- **Progreso** — id, estudiante_id, leccion_id, completada
- **Quiz** — id, curso_id, preguntas (JSON)
- **Certificado** — id, estudiante_id, curso_id, codigo_verificacion
- **Notificacion** — id, usuario_id, titulo, mensaje, tipo, curso_id, leida

### Roles

- `estudiante` — Acceso a cursos inscritos, dashboard, certificados
- `instructor` — CRUD de cursos, módulos, lecciones, quizzes
- `admin` — Gestión de usuarios y contenido

## Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| QA Test | qa-test@suenosdev.com | Test1234! | estudiante |
| Admin | admin@suenosdev.com | Admin1234! | admin |
| Instructor | instructor@test.com | Test1234! | instructor |
| Romario | ingenieroromario@gmail.com | 12345678 | estudiante |

## Decisiones Técnicas

- **TypeORM `synchronize: true`** — Auto-crea esquema en desarrollo. Deshabilitar en producción.
- **Eventos in-process** — EventEmitter2 para comunicación entre contextos (no Cola en desarrollo).
- **Bull queue** — Para emails async con Redis. Reintentos: 3 intentos, backoff exponencial (2s).
- **OAuth condicional** — Las estrategias no crashean si faltan env vars (retornan null).
- **Shared-kernel** — Paquete npm local con tipos DDD base. Se construye antes que la API.
- **`tsconfig` paths** — API resuelve `@suenos-dev/shared-kernel` a `shared-kernel/dist`.
- **`strictPropertyInitialization: false`** — Para entidades TypeORM con decorators.

## Licencia

Proyecto privado. Sueños Dev © 2026.
