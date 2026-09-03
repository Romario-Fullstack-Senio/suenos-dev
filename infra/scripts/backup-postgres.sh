#!/usr/bin/env bash
# ============================================================
# Backup de Postgres — suenos-dev
#
# No había NINGUNA rutina de backup: los volúmenes de Docker no son un
# backup (un `docker compose down -v`, un disco corrupto, o un rm -rf del
# volumen se lleva puesto todo sin ningún punto de restauración).
#
# Uso:
#   ./backup-postgres.sh <deploy-dir> <compose-project> [dias-a-retener]
#   ./backup-postgres.sh ~/deploy/suenos-dev suenos-dev 14
#   ./backup-postgres.sh ~/deploy/suenos-dev-preprod suenos-preprod 3
#
# Instalar como cron diario (crontab -e en el servidor):
#   0 3 * * * /home/deploy/suenos-dev/infra/scripts/backup-postgres.sh \
#     ~/deploy/suenos-dev suenos-dev 14 >> ~/backups/backup.log 2>&1
# ============================================================
set -euo pipefail

DEPLOY_DIR="${1:?Uso: backup-postgres.sh <deploy-dir> <compose-project> [dias-a-retener]}"
COMPOSE_PROJECT="${2:?Falta el nombre del proyecto de Compose (ej. suenos-dev o suenos-preprod)}"
RETENTION_DAYS="${3:-14}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/$COMPOSE_PROJECT}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/postgres-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$DEPLOY_DIR"

# Lee las credenciales del .env del propio stack — no hardcodeadas acá.
ENV_FILE=".env"
[ -f ".env.preprod" ] && [ "$COMPOSE_PROJECT" = "suenos-preprod" ] && ENV_FILE=".env.preprod"
# shellcheck disable=SC1090
source "$ENV_FILE"

echo "[$(date)] Iniciando backup de $COMPOSE_PROJECT..."

docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f docker-compose.prod.yml \
  exec -T postgres pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: el backup quedó vacío — revisar credenciales/conexión." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Backup OK: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retención: borra backups más viejos que RETENTION_DAYS.
find "$BACKUP_DIR" -name "postgres-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Backups con más de $RETENTION_DAYS días eliminados."

# Restaurar (referencia, no se ejecuta acá):
#   gunzip -c postgres-XXXXXXXX-XXXXXX.sql.gz | \
#     docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" \
#     -f docker-compose.prod.yml exec -T postgres psql -U "$DATABASE_USER" "$DATABASE_NAME"
