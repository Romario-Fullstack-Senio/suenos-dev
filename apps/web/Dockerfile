# ============================================================
# Stage 1: Install workspace dependencies
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Root lockfile copied so npm resolves the exact same versions as
# local/CI instead of re-resolving semver ranges fresh against the
# registry (see apps/api/Dockerfile for the concrete bug this caused).
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ============================================================
# Stage 2: Build Next.js (standalone output)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# @sentry/nextjs doesn't hoist to the root due to a peer-dependency
# conflict and stays nested under apps/web/node_modules — copy that too
# (see apps/api/Dockerfile for the same issue on the API side).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY package.json ./
COPY apps/web/ ./apps/web/

# apps/web/public doesn't currently exist in the repo. COPY has no shell,
# so `2>/dev/null || true` on the runner-stage COPY below never actually
# suppressed a missing-source error (it broke every build) — ensure the
# directory is always present instead, even if empty.
RUN mkdir -p apps/web/public

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

# Public directory (images, icons) — the builder stage guarantees this
# exists (mkdir -p), even if empty, since COPY has no shell to fall back on.
COPY --from=builder --chown=suenos:suenos /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

EXPOSE 3000
USER suenos
CMD ["node", "apps/web/server.js"]
