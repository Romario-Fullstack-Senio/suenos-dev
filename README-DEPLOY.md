# ============================================================
# README-DEPLOY.md — Guía de despliegue para suenos-dev
# ============================================================

# Guía de Despliegue — Suenos Dev

## Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │   Caddy     │ :443 (SSL automático)    │
│                    │   Proxy     │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│              ┌────────────┼────────────┐                    │
│              │            │            │                     │
│     ┌────────▼────────┐   │   ┌────────▼────────┐          │
│     │   Web (Next.js) │   │   │  API (NestJS)   │          │
│     │   :3000         │   │   │  :3001           │          │
│     └────────┬────────┘   │   └────────┬────────┘          │
│              │            │            │                     │
│              └────────────┼────────────┘                    │
│                           │                                 │
│              ┌────────────┼────────────┐                    │
│              │            │            │                     │
│     ┌────────▼────────┐ ┌─▼──────────┐ ┌────────────┐      │
│     │   PostgreSQL    │ │   Redis     │ │   MinIO    │      │
│     │   :5432         │ │   :6379     │ │   :9000    │      │
│     │   (127.0.0.1)   │ │   (127.0.0.1)│ │   (127.0.0.1)│   │
│     └─────────────────┘ └────────────┘ └────────────┘      │
│                                                             │
│                    SERVIDOR (Ubuntu 22.04+)                 │
└─────────────────────────────────────────────────────────────┘
```

**Patrón:** "Build Once, Deploy Anywhere"
- GitHub Actions buildea la imagen Docker una vez
- Imagen se publica en GitHub Container Registry (ghcr.io)
- Servidor solo hace `docker compose pull` + `docker compose up`

---

## Requisitos del Servidor

- **OS:** Ubuntu 22.04+ (recomendado) o cualquier Linux con Docker
- **RAM:** Mínimo 4GB (8GB recomendado)
- **Disco:** 50GB+ libres
- **Docker:** 24.0+ con Docker Compose v2
- **Caddy:** 2.7+ (proxy reverso con SSL automático)
- **Acceso:** SSH con usuario `root` o con sudo

---

## Instalación Inicial del Servidor

### 1. Instalar Docker

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker (opcional, para no usar sudo)
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker compose version
```

### 2. Instalar Caddy

```bash
# Instalar Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Verificar instalación
caddy version
```

### 3. Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.), configura:

```
A Record:  suenos-dev.dev      → [IP_DEL_SERVIDOR]
A Record:  api.suenos-dev.dev  → [IP_DEL_SERVIDOR]
```

### 4. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# NO exponer puertos internos (5432, 6379, 9000, 3000, 3001)
# Estos solo se acceden desde 127.0.0.1 (Caddy)
```

### 5. Configurar SSH para GitHub Actions

GitHub Actions se conecta por SSH al servidor para hacer deploy. Necesitas generar una clave SSH dedicada:

```bash
# En tu MÁQUINA LOCAL (no en el servidor)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""

# Copiar la clave pública al servidor
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@TU_SERVIDOR

# Verificar conexión
ssh -i ~/.ssh/github_deploy_key user@TU_SERVIDOR 'echo "SSH OK"'
```

### 6. Configurar GitHub Secrets

En tu repositorio de GitHub → Settings → Secrets and variables → Actions, agregar:

| Secret | Valor |
|--------|-------|
| `SERVER_HOST` | IP o dominio del servidor (ej: `203.0.113.50`) |
| `SERVER_USER` | Usuario SSH del servidor (ej: `root` o `ubuntu`) |
| `SERVER_SSH_KEY` | Contenido completo de `~/.ssh/github_deploy_key` (la clave privada) |
| `SERVER_PORT` | Puerto SSH (default: `22`) |

**Importante:** Copia TODA la clave privada, incluyendo las líneas `BEGIN` y `END`.

---

## Primer Despliegue Manual

### 1. Clonar el repositorio (solo para la configuración inicial)

```bash
cd ~/deploy
git clone https://github.com/Romario-Fullstack-Senior/suenos-dev.git
cd suenos-dev
```

### 2. Configurar variables de entorno

```bash
# Copiar el ejemplo
cp infra/.env.example .env

# Editar con valores reales
nano .env
```

**Reemplazar TODOS los placeholders:**
- `CHANGE_ME_STRONG_PASSWORD_HERE` → contraseña fuerte para PostgreSQL
- `CHANGE_ME_REDIS_PASSWORD_HERE` → contraseña para Redis
- `CHANGE_ME_MINIO_PASSWORD_HERE` → contraseña para MinIO
- `CHANGE_ME_GENERATE_RANDOM_HEX_32` → ejecutar `openssl rand -hex 32`
- `sk_live_CHANGE_ME` → tu clave secreta de Stripe (producción)
- `whsec_CHANGE_ME` → tu webhook secret de Stripe
- `pk_live_CHANGE_ME` → tu clave pública de Stripe

### 3. Configurar Caddy

```bash
# Copiar Caddyfile
sudo cp infra/Caddyfile /etc/caddy/Caddyfile

# Editar si es necesario
sudo nano /etc/caddy/Caddyfile

# Reiniciar Caddy
sudo systemctl restart caddy
```

### 4. Crear directorio para logs de Caddy

```bash
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
```

### 5. Iniciar servicios

```bash
cd ~/deploy/suenos-dev

# Pull imágenes
docker compose pull

# Iniciar en background
docker compose up -d

# Verificar estado
docker compose ps

# Ver logs
docker compose logs -f api
```

### 6. Verificar funcionamiento

```bash
# Health check API
curl https://api.suenos-dev.dev/health

# Verificar frontend
curl -I https://suenos-dev.dev

# Ver logs de Caddy
sudo journalctl -u caddy -f
```

---

## Correr Migraciones TypeORM

Las migraciones se ejecutan como un job separado, **NO** durante el arranque del contenedor API.

### Opción 1: Usar el contenedor existente

```bash
# Ejecutar migraciones dentro del contenedor API
docker compose exec api node dist/main.js --migrate-only
```

### Opción 2: Crear un job dedicado

```bash
# Crear script de migración
cat > ~/deploy/suenos-dev/migrate.sh <<'EOF'
#!/bin/bash
set -e

cd ~/deploy/suenos-dev

echo "Running database migrations..."
docker compose run --rm api node dist/main.js --migrate-only

echo "Migrations completed successfully!"
EOF

chmod +x ~/deploy/suenos-dev/migrate.sh

# Ejecutar
./migrate.sh
```

### Opción 3: Agregar comando npm para migraciones

En `apps/api/package.json`, agregar script:

```json
{
  "scripts": {
    "migrate": "node dist/main.js --migrate-only"
  }
}
```

Luego ejecutar:

```bash
docker compose run --rm api npm run migrate
```

---

## Ver Logs por Servicio

```bash
# Logs de todos los servicios
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f minio

# Últimas 100 líneas
docker compose logs --tail=100 api

# Logs con timestamps
docker compose logs -f -t api

# Logs de Caddy (proxy reverso)
sudo journalctl -u caddy -f
sudo tail -f /var/log/caddy/suenos-dev.log
sudo tail -f /var/log/caddy/api-suenos-dev.log
```

---

## Rollback usando Tag SHA

### 1. Identificar el commit a restaurar

```bash
# Ver historial de commits
git log --oneline -10

# Ejemplo de salida:
# a1b2c3d Último commit
# e4f5g6h Commit anterior
# i7j8k9l Tercer commit
```

### 2. Editar .env para usar el tag SHA

```bash
cd ~/deploy/suenos-dev

# Editar .env
nano .env

# Cambiar los tags:
# API_TAG=a1b2c3d
# WEB_TAG=a1b2c3d
```

### 3. Pull y reiniciar

```bash
# Pull imágenes con el tag específico
docker compose pull api web

# Reiniciar servicios
docker compose up -d --remove-orphans

# Verificar
docker compose ps
curl https://api.suenos-dev.dev/health
```

### 4. Rollback completo (si algo falla)

```bash
# Restaurar docker-compose.yml y .env
git checkout main -- infra/docker-compose.prod.yml infra/.env.example

# Copiar .env de nuevo
cp infra/.env.example .env
nano .env  # Restaurar valores

# Reiniciar
docker compose down
docker compose pull
docker compose up -d
```

---

## Comandos Útiles

```bash
# Ver estado de contenedores
docker compose ps

# Reiniciar un servicio
docker compose restart api

# Reconstruir localmente (solo para debug)
docker compose build api

# Entrar a un contenedor
docker compose exec api sh
docker compose exec postgres psql -U suenos_admin suenos_prod

# Verificar uso de recursos
docker stats

# Limpiar imágenes no usadas
docker image prune -a

# Backup de PostgreSQL
docker compose exec postgres pg_dump -U suenos_admin suenos_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20240101.sql | docker compose exec -T postgres psql -U suenos_admin -d suenos_prod
```

---

## Variables de Entorno de Referencia

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_DB` | Nombre de la base de datos | `suenos_prod` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `suenos_admin` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `SuperSecret123!` |
| `REDIS_PASSWORD` | Contraseña de Redis | `RedisSecret456!` |
| `JWT_SECRET` | Secreto para JWT (hex 32) | `a1b2c3d4e5f6...` |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret Stripe | `whsec_...` |
| `STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe | `pk_live_...` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `your@email.com` |
| `SMTP_PASS` | Contraseña SMTP | `app-password` |
| `SENTRY_DSN` | DSN de Sentry (opcional) | `https://...@sentry.io/...` |
| `SENDGRID_API_KEY` | API Key SendGrid (opcional) | `SG....` |

---

## Troubleshooting

### API no responde

```bash
# Ver logs de la API
docker compose logs api

# Verificar conexión a PostgreSQL
docker compose exec api wget -qO- http://localhost:3001/health

# Reiniciar API
docker compose restart api
```

### PostgreSQL no acepta conexiones

```bash
# Ver logs
docker compose logs postgres

# Verificar salud
docker compose exec postgres pg_isready -U suenos_admin

# Reiniciar
docker compose restart postgres
```

### SSL no funciona

```bash
# Verificar Caddy
sudo systemctl status caddy
sudo journalctl -u caddy -f

# Verificar DNS
dig suenos-dev.dev
dig api.suenos-dev.dev

# Reiniciar Caddy
sudo systemctl restart caddy
```

### Imágenes no se actualizan

```bash
# Forzar pull de nuevas imágenes
docker compose pull api web

# Recrear contenedores
docker compose up -d --force-recreate api web
```

---

## Seguridad

- [x] PostgreSQL, Redis, MinIO solo accesibles por 127.0.0.1
- [x] Contenedores corren como usuario no-root (UID 1001)
- [x] SSL automático con Let's Encrypt (Caddy)
- [x] Healthchecks en todos los servicios críticos
- [x] Rate limiting en API (via NestJS Throttler)
- [x] Variables sensibles en .env (no en el repositorio)
- [x] .env en .gitignore

---

## Estructura de Archivos en el Servidor

```
~/deploy/suenos-dev/
├── docker-compose.yml    # ← Copiar de infra/docker-compose.prod.yml
├── .env                  # ← Variables de entorno (NO en el repo)
├── migrate.sh            # ← Script de migraciones (opcional)
└── logs/                 # ← Logs locales (opcional)

/etc/caddy/
└── Caddyfile             # ← Configuración de Caddy

/var/log/caddy/
├── suenos-dev.log        # ← Logs del frontend
└── api-suenos-dev.log    # ← Logs del backend
```

---

## GitHub Secrets Requeridos

En tu repositorio de GitHub → Settings → Secrets and variables → Actions:

| Secret | Descripción |
|--------|-------------|
| `GITHUB_TOKEN` | Token automático (ya existe) |
| `SERVER_HOST` | IP o dominio del servidor |
| `SERVER_USER` | Usuario SSH del servidor |
| `SERVER_SSH_KEY` | Clave privada SSH para deploy |
| `SERVER_PORT` | Puerto SSH (default: 22) |

---

## Flujo Completo de Despliegue

```
1. Developer hace push a main
       ↓
2. GitHub Actions buildea imágenes Docker (API + Web)
       ↓
3. Imágenes se publican en ghcr.io con tags :latest y :SHA
       ↓
4. deploy.yml se dispara automáticamente
       ↓
5. GitHub Actions se conecta por SSH al servidor
       ↓
6. Servidor hace docker compose pull (NUNCA build)
       ↓
7. Servidor hace docker compose up -d
       ↓
8. Health checks verifican que todo funcione
       ↓
9. ✅ Despliegue completado
```

---

## Notas Importantes

1. **El servidor NUNCA compila código** — solo hace pull de imágenes pre-construidas
2. **Build Once, Deploy Anywhere** — la misma imagen se puede desplegar en dev, staging, prod
3. **Rollback rápido** — cambiar el tag SHA en .env y reiniciar (< 1 minuto)
4. **Sin downtime** — Docker Compose reconoce contenedores nuevos gradualmente
5. **Logs centralizados** — todos los logs se pueden ver con `docker compose logs`
6. **SSL automático** — Caddy genera y renueva certificados automáticamente
