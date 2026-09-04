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
# Stage 2: Build Next.js
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
# so `2>/dev/null || true` on a runner-stage COPY never actually suppresses
# a missing-source error (it broke every build) — ensure the directory is
# always present instead, even if empty.
RUN mkdir -p apps/web/public

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

# NOT next's `output: 'standalone'` copy (see next.config.mjs for why it's
# not used) — ship the full pruned node_modules instead, same reliable
# pattern as apps/api/Dockerfile, and run with `next start`.
COPY --from=builder --chown=suenos:suenos /app/node_modules ./node_modules
COPY --from=builder --chown=suenos:suenos /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=suenos:suenos /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=suenos:suenos /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder --chown=suenos:suenos /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=suenos:suenos /app/apps/web/public ./apps/web/public

# Strip devDependencies (npm prune reads apps/web/package.json here, same
# as the API image — see apps/api/Dockerfile for the "prune uses the wrong
# package.json" bug that taught us to always double check this).
RUN cd apps/web && npm prune --omit=dev 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

EXPOSE 3000
USER suenos
WORKDIR /app/apps/web
# `next` itself hoists to the ROOT node_modules (not nested under
# apps/web/node_modules), so there's no apps/web/node_modules/.bin/next to
# call directly — `npm start` (runs the "start": "next start" script from
# apps/web/package.json) lets npm resolve the hoisted binary correctly via
# its own PATH setup, same as it would locally.
CMD ["npm", "start"]
