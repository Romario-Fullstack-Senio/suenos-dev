# ============================================================
# Stage 1: Install workspace dependencies
# ============================================================
FROM node:24-alpine AS deps

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
FROM node:24-alpine AS builder

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

# Next inlines every NEXT_PUBLIC_* variable into the bundle AT BUILD TIME, so
# they must exist here — setting them later in docker-compose does nothing
# for the browser bundle. build-and-push.yml passes them per branch (main →
# production, develop → preprod). Before this, none were passed: every
# deployed image had the localhost fallbacks baked in (the browser called its
# own localhost:3001, canonical/sitemap pointed to localhost:3000, and Stripe
# Elements had no publishable key).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build --workspace=apps/web

# ============================================================
# Stage 3: Production image (minimal, non-root)
# ============================================================
FROM node:24-alpine AS runner

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
# Server-side fetches (Server Components, sitemap, generateMetadata) go
# straight to the API over the Compose network — `api` is the service name in
# infra/docker-compose.prod.yml, same for prod and preprod. The public
# NEXT_PUBLIC_API_URL isn't always reachable from inside the container (in
# preprod it's a localhost:3101 that only exists on the other side of the SSH
# tunnel). Read at runtime (no NEXT_PUBLIC_ prefix), so compose can override it.
ENV API_INTERNAL_URL=http://api:3001/api

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
