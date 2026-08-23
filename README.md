# Suenos Dev

Plataforma de e-learning con cursos, streaming de video, quiz y certificados verificables.

## Arquitectura

Monorepo con **NestJS** (backend) + **Next.js** (frontend), organizado en Bounded Contexts siguiendo **DDD + Arquitectura Hexagonal**.

### Bounded Contexts

| Contexto | Subdominio | Responsabilidad |
|----------|-----------|-----------------|
| identity | Core | Usuarios, roles, JWT auth |
| catalog | Core | Cursos, modulos, lecciones |
| content-delivery | Core | Streaming video, progreso |
| assessment | Core | Quiz de evaluacion |
| certification | Core | Certificados PDF verificables |
| payments | Supporting | Stripe Checkout,_ordenes |
| enrollment | Supporting | Inscripciones, acceso a cursos |
| notifications | Supporting | Emails (event-driven) |

### Convencion de Capas

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
├── infrastructure/             # Implementacion de puertos
│   ├── typeorm/                # ORM entities + repositorios
│   └── <adapter>/              # MinIO, Stripe, PDF, LinkedIn, etc.
└── interfaces/                 # Controladores HTTP + DTOs
```

**Reglas:**
- El dominio solo define interfaces (puertos); infrastructure las implementa.
- La comunicacion entre contextos es por eventos de dominio (EventEmitter2).
- Cada Aggregate Root expone metodos de negocio con nombres de dominio.

## Prerequisitos

- Node.js >= 20
- Docker + Docker Compose

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
```

### 4. Desarrollo

```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend
npm run dev:web
```

- API: http://localhost:3001/api
- Web: http://localhost:3000
- MinIO Console: http://localhost:9001

### 5. Con Docker (produccion)

```bash
npm run docker:dev
```

## Endpoints API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/registro | Registrar usuario |
| POST | /api/auth/login | Login y obtener JWT |
| POST | /api/cursos | Crear curso |
| POST | /api/cursos/:id/publicar | Publicar curso |
| POST | /api/cursos/:id/modulos | Agregar modulo |
| POST | /api/cursos/:id/modulos/:mid/lecciones | Agregar leccion |
| POST | /api/videos/upload | Subir video |
| POST | /api/progreso | Registrar progreso |
| POST | /api/quizzes | Crear quiz |
| POST | /api/quizzes/:id/resolver | Resolver quiz |
| GET | /api/certificados/:id/verificar | Verificar certificado |
| POST | /api/ordenes | Crear orden de pago |
| POST | /api/stripe/webhook | Webhook Stripe |
| GET | /api/inscripciones/estudiante/:id | Ver inscripciones |

## Frontend

| Ruta | Descripcion |
|------|-------------|
| / | Landing page |
| /cursos/[slug] | Pagina publica del curso |
| /checkout | Flujo de compra |
| /aprender/[cursoId] | Reproductor + modulos |
| /aprender/[cursoId]/quiz | Quiz de evaluacion |
| /certificados/[id] | Verificacion publica de certificado |

## Proximos Pasos

- [ ] Integracion real con Stripe (webhook signature verification)
- [ ] Transcodificacion de video con FFmpeg
- [ ] Generacion de PDF real con PDFKit
- [ ] Link de "Add to LinkedIn Profile"
- [ ] Integracion con Resend/Nodemailer para emails
- [ ] Deploy con Traefik + SSL en suenosdev.com