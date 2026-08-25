# ============================================================
# Stage 1: Install workspace dependencies
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/

RUN npm install

# ============================================================
# Stage 2: Build Next.js (standalone output)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package.json ./
COPY apps/web/ ./apps/web/

# Next.js standalone build — output goes to .next/standalone/
# withSentryConfig in next.config.mjs is a no-op when SENTRY_AUTH_TOKEN is unset
ENV SENTRY_AUTH_TOKEN=""
RUN npm run build --workspace=apps/web

# ============================================================
# Stage 3: Production image (minimal, non-root)
# ============================================================
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 suenos \
 && adduser --system  --uid 1001 suenos

WORKDIR /app

# standalone output contains server.js + a pruned node_modules copy
COPY --from=builder --chown=suenos:suenos /app/apps/web/.next/standalone ./

# Static assets
COPY --from=builder --chown=suenos:suenos /app/apps/web/.next/static ./apps/web/.next/static

# Public directory (images, icons) — may not exist
COPY --from=builder --chown=suenos:suenos /app/apps/web/public ./apps/web/public 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

EXPOSE 3000
USER suenos
CMD ["node", "apps/web/server.js"]
